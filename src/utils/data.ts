import { parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";

import type { Driver, Round } from "./types";

import { getTeamLogo } from "./teams-logos";
import { getBackgroundImage } from "./circuits-backgrounds";

const DATA_URL = import.meta.env.VITE_DATA_URL as string;
const ENFORCE_CACHE_UPDATE = true?`?v=${Date.now()}`:''

export async function getYears(): Promise<number[]> {
    // TODO: change this to something more clever (dont use a meta file, but check the folders in the data dir)
    const responseYears = await fetch(`${DATA_URL}/years.meta${ENFORCE_CACHE_UPDATE}`);
    const data = await responseYears.text();
    let availableYears: number[] = data.split(",").map(Number);
    return availableYears.sort();
}

export async function getDrivers(year:number): Promise<Driver[]> {
    const responseDrivers = await fetch(`${DATA_URL}/${year}/drivers_${year}.json${ENFORCE_CACHE_UPDATE}`);
    const contentType = responseDrivers.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        return [];
    }
    const rawDrivers = await responseDrivers.json() as Driver[];
    const drivers = rawDrivers.map((driver) => ({
        ...driver,
        points: 0,
        recentProfit: 0,
        teamLogo: getTeamLogo(driver.team),
    }));
    return drivers
}

export async function getRounds(year:number): Promise<Round[]> {
    const responseRounds = await fetch(`${DATA_URL}/${year}/rounds_${year}.json${ENFORCE_CACHE_UPDATE}`);
    const contentType = responseRounds.headers.get("content-type");
    let rounds: Round[] = [];
    if (!contentType) {
        return [];
    }
    rounds = await responseRounds.json() as Round[];
    return rounds
}

export async function getResults(
    roundIdx: number,
    drivers: Driver[] = [],
    rounds: Round[] = [],
): Promise<{ drivers: Driver[], round: Round, rounds: Round[]}> {

    if (drivers.length === 0 || rounds.length === 0) {
        return { drivers, round: {} as Round, rounds };
    }

    // TODO: check if this is still necessary
    let driverMap = new Map(drivers.map(d => [d.id, d]));
    rounds = rounds.map((round) => ({
        ...round,
        backgroundImage: getBackgroundImage(round.name),
        results: round.results.map((result) => ({
            ...result,
            driver: driverMap.get(result.driver_id),
        }))
    }));

    // setting focus round
    const actualIdx = Math.max(1, Math.min(roundIdx, rounds.length));
    const currentRound = rounds[actualIdx - 1];

    // calculating points and profits
    drivers.forEach(d => { d.points = 0; d.recentProfit = 0; });
    driverMap = new Map(drivers.map(d => [d.id, d]));
    for (let i = 0; i < actualIdx - 1; i++) {
        rounds[i].results.forEach(res => {
            const d = driverMap.get(res.driver_id);
            if (d) d.points += (res.racePoints + res.sprintPoints);
        });
    }
    let oldRanks: string[] = [];
    if (actualIdx > 1) {
        oldRanks = [...drivers]
            .sort((a, b) => b.points - a.points)
            .map(d => d.id as unknown as string);
    }
    currentRound.results.forEach(res => {
        const d = driverMap.get(res.driver_id);
        if (d) d.points += (res.racePoints + res.sprintPoints);
    });
    if (actualIdx > 1) {
        const newRanks = [...drivers]
            .sort((a, b) => b.points - a.points)
            .map(d => d.id as unknown as string);

        drivers.forEach(driver => {
            const oldPos = oldRanks.indexOf(driver.id as unknown as string);
            const newPos = newRanks.indexOf(driver.id as unknown as string);
            driver.recentProfit = oldPos - newPos;
        });
    }
    drivers.sort((a, b) => b.points - a.points);
    return { drivers, round: currentRound, rounds};
}

export async function getTimeToNextRace(): Promise<{ days: number, hours: number, minutes: number, weekendName: string }> {
    const now = new Date();
    const year = now.getFullYear();
    const responseDates = await fetch(`${DATA_URL}/${year}/dates_${year}.json${ENFORCE_CACHE_UPDATE}`);
    const rawDates = await responseDates.json() as {name:string, date:string}[];
    
    // get next and last events
    let nextEventDate: Date | null = null;
    let nextEventName: string = "";
    let lastEventDate: Date | null = null;
    let lastEventName: string = "";
    for(const date of rawDates) {
        const eventDate = new Date(date["date"]);
        if (eventDate <= now && (!lastEventDate || eventDate > lastEventDate)) {
            lastEventDate = eventDate;
            lastEventName = date["name"];
        }
        if (eventDate > now && (!nextEventDate || eventDate < nextEventDate)) {
            nextEventDate = eventDate;
            nextEventName = date["name"];
        }
    }

    // DEBUG TRICK
    // lastEventDate = new Date("2026-03-01T00:00:00Z");
    // nextEventDate = new Date("2026-03-08T10:00:00Z");
    
    // Check if is race weekend
    const lastDiffInSeconds = lastEventDate ? (now.getTime() - lastEventDate.getTime()) / 1000 : 0;
    const lastDiffInDays = lastDiffInSeconds / (60 * 60 * 24); 
    if (lastDiffInSeconds > 0 && lastDiffInDays < 3) { 
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            weekendName: lastEventName || "Grand Prix",
        }
    } 
    
    // If not, calculate time to next event
    const nextDiffInSeconds = nextEventDate ? (nextEventDate.getTime() - now.getTime()) / 1000 : 0;
    const nextDiffInMinutes = Math.floor(nextDiffInSeconds / 60) % 60
    const nextDiffInHours = Math.floor(nextDiffInSeconds / 60 / 60) % 24
    const nextDiffInDays = Math.floor(nextDiffInSeconds / 60 / 60 / 24)
    return {
        days: nextDiffInDays,
        hours: nextDiffInHours,
        minutes: nextDiffInMinutes,
        weekendName: nextEventName || "Grand Prix",
    }
}

export async function getTelemetryData(driverId: string|undefined, roundIdx: number|undefined): Promise<string> {
    if (!driverId || !roundIdx) return "";
    const year = driverId.split("_").slice(-1)[0];
    const filename = `telemetry_${driverId}_${roundIdx}.csv`;
    const response = await fetch(`${DATA_URL}/${year}/telemetries/race_${roundIdx}/${filename}${ENFORCE_CACHE_UPDATE}`);
    const data = await response.text();
    return data;
}


const REPLAY_NUMERIC_COLUMNS = new Set([
    "lap_number", "x", "y", "z", "time", "position", "stint",
    "gap_to_leader", "gap_to_front",
    "current_best_lap_time", "last_lap_time",
    "current_sector1_time", "current_sector2_time", "current_sector3_time",
]);
const REPLAY_BOOLEAN_COLUMNS = new Set(["is_in_pit", "is_retired"]);

function toNumber(v: unknown): number {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    if (typeof v === "bigint") return Number(v);
    if (v == null) return 0;
    const n = Number(v as string);
    return Number.isFinite(n) ? n : 0;
}

function toBestSectorTime(v: unknown): [number, number, number] {
    if (Array.isArray(v)) {
        return [toNumber(v[0]), toNumber(v[1]), toNumber(v[2])];
    }
    if (typeof v === "string") {
        const inner = v.trim().replace(/^\[|\]$/g, '');
        const parts = inner.split(',').map(p => toNumber(p.trim()));
        return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
    }
    return [0, 0, 0];
}

function normalizeReplayRow(row: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(row)) {
        const raw = row[key];
        if (key === "best_sector_time") {
            out[key] = toBestSectorTime(raw);
        } else if (REPLAY_NUMERIC_COLUMNS.has(key)) {
            out[key] = toNumber(raw);
        } else if (REPLAY_BOOLEAN_COLUMNS.has(key)) {
            out[key] = raw === true || raw === "True" || raw === "true" || raw === 1 || raw === "1";
        } else {
            out[key] = raw ?? "";
        }
    }
    return out;
}

export async function getReplayData(year: number, roundIdx: number): Promise<Record<string, unknown>[]> {
    if (!roundIdx || !year) return [];
    const filename = `replay_${year}_race_${roundIdx}.parquet`;
    const url = `${DATA_URL}/${year}/replays/${filename}${ENFORCE_CACHE_UPDATE}`;
    const response = await fetch(url);
    if (!response.ok) {
        console.error('parquet fetch failed', response.status, url);
        return [];
    }
    const buffer = await response.arrayBuffer();
    try {
        const rows = await parquetReadObjects({ file: buffer, compressors }) as Record<string, unknown>[];
        return rows.map(normalizeReplayRow);
    } catch (err) {
        console.error('parquetReadObjects failed', err);
        return [];
    }
}

