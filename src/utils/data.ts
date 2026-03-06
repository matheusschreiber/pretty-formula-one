import type { Driver, Round } from "./types";

import { getTeamLogo } from "./teams-logos";
import { getBackgroundImage } from "./circuits-backgrounds";

export async function getTimeToNextRace(): Promise<{ days: number, hours: number, minutes: number }> {
    return {
        days: 14,
        hours: 15,
        minutes: 35,
    }
}

export async function getData(
    year: number, 
    roundIdx: number,
    drivers: Driver[] = [],
    rounds: Round[] = []
): Promise<{ drivers: Driver[], round: Round, rounds: Round[] }> {

    // getting drivers if not already fetched
    if (drivers.length === 0) {
        const responseDrivers = await fetch(`/data/drivers_${year}.json`);
        const rawDrivers = await responseDrivers.json() as Driver[];
        drivers = rawDrivers.map((driver) => ({
            ...driver,
            points: 0,
            recentProfit: 0,
            teamLogo: getTeamLogo(driver.team),
        }));
    }

    // getting rounds if not already fetched
    if (rounds.length === 0) {
        const responseRounds = await fetch(`/data/rounds_${year}.json`);
        rounds = await responseRounds.json() as Round[];
        const driverMap = new Map(drivers.map(d => [d.id, d]));
        rounds = rounds.map((round) => ({
            ...round,
            backgroundImage: getBackgroundImage(round.name),
            results: round.results.map((result) => ({
                ...result,
                driver: driverMap.get(result.driver_id),
            }))
        }));
    }

    // setting focus round
    const actualIdx = Math.max(1, Math.min(roundIdx, rounds.length));
    const currentRound = rounds[actualIdx - 1];

    // calculating points and profits
    drivers.forEach(d => { d.points = 0; d.recentProfit = 0; });
    const driverMap = new Map(drivers.map(d => [d.id, d]));
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