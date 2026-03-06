export type Driver = {
    id: number,
    team: string,
    abbreviation: string,
    name: string,
    points: number,
    recentProfit: number,
    teamLogo: string,
}

export type RaceResult = {
    id: number,
    driver_id: number,
    driver?: Driver,
    racePoints: number,
    sprintPoints: number,
}

export type Round = {
    id: number,
    index: number,
    totalRounds: number,
    name: string,
    nameVerbose: string,
    country: string,
    backgroundImage: string,
    year: number,
    results: RaceResult[],
}