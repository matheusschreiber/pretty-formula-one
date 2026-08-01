import type { Driver, Round } from "./types";

export interface DriverStanding {
    points: number;
    driver: Driver;
}

export interface RoundStandings {
    round: Round;
    standings: DriverStanding[];
}

export function getChampionshipStandings(rounds: Round[]): RoundStandings[] {

    var standings: RoundStandings[] = [];
    var driverStandingMap: Record<string, {driver: Driver, points: number}> = {};

    for(const round of rounds) {
        for(const result of round.results) {
            const driver = result.driver;
            const points = result.racePoints + result.sprintPoints;
            if (!driver || points === 0) continue;
            if (!driverStandingMap[driver.id]) {
                driverStandingMap[driver.id] = { driver, points: 0 };
            }
            driverStandingMap[driver.id].points += points;
        }

        var driverStandings: DriverStanding[] = Object.values(driverStandingMap).map(({ driver, points }) => ({ driver, points }));
        driverStandings.sort((a, b) => b.points - a.points);
        standings.push({ round, standings: driverStandings });
    }

    return standings;
}