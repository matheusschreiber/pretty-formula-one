export type Driver = {
    id: string,
    team: string, // TODO: this is temporary
    abbreviation: string,
    name: string,
    points: number,
    recentProfit: number,
    teamLogo: string,
    photo: string,
}

export type RaceResult = {
    id: number,
    driver_id: string, // TODO: REMOVE
    driver?: Driver,
    racePoints: number,
    sprintPoints: number,
    tyreStrat: {
        lapStart: number,
        lapEnd: number,
        compound: TyreType,
        stint: number
    }[],
    retired: boolean,
}

export type Round = {
    id: number,
    index: number,
    totalRounds: number,
    totalLaps: number,
    name: string,
    nameVerbose: string,
    country: string,
    backgroundImage: string,
    year: number,
    results: RaceResult[],
}

export type TyreType = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';