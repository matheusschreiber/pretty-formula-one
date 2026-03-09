import type { Driver, Round } from "./types";

import { getTeamLogo } from "./teams-logos";
import { getBackgroundImage } from "./circuits-backgrounds";

export async function getTimeToNextRace(): Promise<{ days: number, hours: number, minutes: number, weekendName: string }> {
    const now = new Date();
    const year = now.getFullYear();
    const responseDates = await fetch(`/data/dates_${year}.json`);
    const contentType = responseDates.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            weekendName: "Grand Prix",
        };
    }
    const rawDates = await responseDates.json() as {name:string, date:string}[];
    
    // get next and last events
    let nextEventDate: Date | null = null;
    let nextEventName: string = "";
    let lastEventDate: Date | null = null;
    let lastEventName: string = "";
    for(let date of rawDates) {
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
    let lastDiffInSeconds = lastEventDate ? (now.getTime() - lastEventDate.getTime()) / 1000 : 0;
    let lastDiffInDays = lastDiffInSeconds / (60 * 60 * 24); 
    if (lastDiffInSeconds > 0 && lastDiffInDays < 3) { 
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            weekendName: lastEventName || "Grand Prix",
        }
    } 
    
    // If not, calculate time to next event
    let nextDiffInSeconds = nextEventDate ? (nextEventDate.getTime() - now.getTime()) / 1000 : 0;
    let nextDiffInMinutes = Math.floor(nextDiffInSeconds / 60) % 60
    let nextDiffInHours = Math.floor(nextDiffInSeconds / 60 / 60) % 24
    let nextDiffInDays = Math.floor(nextDiffInSeconds / 60 / 60 / 24)
    return {
        days: nextDiffInDays,
        hours: nextDiffInHours,
        minutes: nextDiffInMinutes,
        weekendName: nextEventName || "Grand Prix",
    }
}

export async function getData(
    year: number, 
    roundIdx: number,
    drivers: Driver[] = [],
    rounds: Round[] = []
): Promise<{ drivers: Driver[], round: Round, rounds: Round[] }> {

    // getting drivers if not already fetched
    const responseDrivers = await fetch(`/data/drivers_${year}.json`);
    let contentType = responseDrivers.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        return {
            drivers: [],
            round: {} as Round,
            rounds: [],
        };
    }
    const rawDrivers = await responseDrivers.json() as Driver[];
    drivers = rawDrivers.map((driver) => ({
        ...driver,
        points: 0,
        recentProfit: 0,
        teamLogo: getTeamLogo(driver.team),
    }));

    // getting rounds if not already fetched
    const responseRounds = await fetch(`/data/rounds_${year}.json`);
    contentType = responseRounds.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        return {
            drivers: [],
            round: {} as Round,
            rounds: [],
        };
    }
    rounds = await responseRounds.json() as Round[];
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

    return { drivers, round: currentRound, rounds };
}

export async function getTelemetryData(): Promise<string> {
    const response = await fetch(`/data/telemetry_VER_Monaco_2024.csv`);
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/csv")) {
        return "";
    }
    const data = await response.text();
    return data;
}