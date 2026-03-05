import type { Driver, RaceResult, Round } from "./types";

import ferrari from '../assets/icons/ferrari.png'
import mercedes from '../assets/icons/mercedes.png'
import mclaren from '../assets/icons/mclaren.png'

import bahrein from '../assets/circuits/bahrein.png'

export async function getTimeToNextRace(): Promise<{ days: number, hours: number, minutes: number }> {
    return {
        days: 14,
        hours: 15,
        minutes: 35,
    }
}

export async function getDrivers(): Promise<Driver[]> {
    return Promise.resolve([
        {
            id: 1,
            team: 'Ferrari',
            abbreviation: 'HAM',
            name: 'Hamilton',
            points: 398.0,
            recentProfit: 12,
            teamLogo: ferrari,
        },
        {
            id: 2,
            team: 'Mercedes',
            abbreviation: 'RUS',
            name: 'Russell',
            points: 234.0,
            recentProfit: 0,
            teamLogo: mercedes,
        },
        {
            id: 3,
            team: 'McLaren',
            abbreviation: 'NOR',
            name: 'Norris',
            points: 200.0,
            recentProfit: 2,
            teamLogo: mclaren,
        }
    ])
}

export function getRound(roundId: number): Promise<Round> {

    return Promise.resolve({
        id: 1,
        index: 1,
        totalRounds: 24,
        name: 'Bahrain',
        nameVerbose: 'Bahrain Grand Prix',
        country: 'Bahrain',
        backgroundImage: bahrein,
        results: [
        {
            id: 1,
            driver: {
                id: 1,
                team: 'Ferrari',
                abbreviation: 'HAM',
                name: 'Hamilton',
                points: 398.0,
                recentProfit: 12,
                teamLogo: ferrari,
            } as Driver,
            racePoints: 25,
            sprintPoints: 10,
        } as RaceResult,
        {
            id: 2,
            driver: {
                id: 2,
                team: 'Mercedes',
                abbreviation: 'RUS',
                name: 'Russell',
                points: 234.0,
                recentProfit: 0,
                teamLogo: mercedes,
            } as Driver,
            racePoints: 18,
            sprintPoints: 8,
        } as RaceResult,
        {
            id: 3,
            driver: {
                id: 3,
                team: 'McLaren',
                abbreviation: 'NOR',
                name: 'Norris',
                points: 200.0,
                recentProfit: 2,
                teamLogo: mclaren,
            } as Driver,
            racePoints: 15,
            sprintPoints: 6,
        } as RaceResult,
    ]
    })
} 