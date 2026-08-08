import type { Driver, Round } from "./types";

export interface DriverStandingsFlat {
    driver: Driver;
    points: number;
}

export interface RoundStandings {
    round: Round;
    standings: DriverStandingsFlat[];
}

export function getStandingsPerRound(rounds: Round[]): RoundStandings[] {

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

        var driverStandings: DriverStandingsFlat[] = Object.values(driverStandingMap).map(({ driver, points }) => ({ driver, points }));
        driverStandings.sort((a, b) => b.points - a.points);
        standings.push({ round, standings: driverStandings });
    }

    return standings;
}

export interface DriverStandings {
    driver: Driver;
    standings: {
        round: Round;
        position: number;
        points: number;
        totalPoints: number;
    }[];
}

export function getDriverStandingEvolution(rounds: Round[]): DriverStandings[] {
    const map = new Map<string, DriverStandings>();
    rounds.forEach((round, i) => {
        round.results.forEach((result, j) => {
            if (!result.driver) console.log(result)
            if (!map.has(result.driver_id)) {
                map.set(result.driver_id, {
                    driver: result.driver as Driver,
                    standings: new Array(rounds.length).fill({ 
                        round, 
                        position: 0, 
                        points: 0,
                        totalPoints: 0
                    }),
                });
            }
            const driverStanding = map.get(result.driver_id)!;
            const points = result.racePoints + result.sprintPoints;
            driverStanding.standings[i] = {
                round,
                points: points,
                position: result.retired ? -1 : j + 1,
                totalPoints: i > 0 ? driverStanding.standings[i - 1].totalPoints + points : points,
            };
        });
    });
    const arr = Array.from(map.values());
    arr.sort((a, b) => b.standings[b.standings.length - 1].totalPoints - a.standings[a.standings.length - 1].totalPoints);
    return arr;
}