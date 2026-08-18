import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { Driver, Round } from '../utils/types';
import { getDrivers, getResults, getRounds, getYears } from '../utils/data';
import { useSearchParams } from 'react-router-dom';

interface ContextType {
    drivers: Driver[];
    rounds: Round[];
    round: Round;
    years: number[];
    year: number;

    onChangeYear: (year: number) => Promise<void>;
    onChangeRound: (roundIndex: number) => Promise<void>;
}

export const Context = createContext<ContextType>({
    drivers: [],
    rounds: [],
    round: {} as Round,
    years: [],
    year: 0,
    onChangeYear: async (_: number) => {},
    onChangeRound: async (_: number) => {},
});

export const ContextProvider = ({ children }: { children: ReactNode }) => {

    const [drivers, setDrivers] = useState<Driver[]>([]);

    const [rounds, setRounds] = useState<Round[]>([]);
    const [round, setRound] = useState<Round>({} as Round);
    
    const [years, setYears] = useState<number[]>([]);    
    const [year, setYear] = useState<number>(new Date().getFullYear());

    const [searchParams, setSearchParams] = useSearchParams()

    async function onChangeYear(newYear: number) {
        const responseYears = await getYears();
        setYears(responseYears);
        if (!responseYears.includes(newYear)) newYear = responseYears.slice(-1)[0];
        setYear(newYear);
        const responseDrivers = await getDrivers(newYear)
        const responseRounds = await getRounds(newYear)
        let roundParam = Number(searchParams.get("round"));
        if (!roundParam || !responseRounds.find(r => r.index === roundParam)) {
            roundParam = responseRounds.slice(-1)[0].index;
        }
        const responseRoundResults = await getResults(roundParam, responseDrivers, responseRounds);
        setRound(responseRoundResults.round);
        setDrivers(responseRoundResults.drivers);
        setRounds(responseRoundResults.rounds);
        setSearchParams((prev) => {
            prev.set("year", newYear.toString()); 
            prev.set("round", roundParam.toString()); 
            return prev;
        });
    }

    async function onChangeRound(newRoundIndex: number) {
        const responseRoundResults = await getResults(newRoundIndex, drivers, rounds);
        setRound(responseRoundResults.round);
        setDrivers(responseRoundResults.drivers);
        setRounds(responseRoundResults.rounds);
        setSearchParams((prev) => {
            prev.set("round", responseRoundResults.round.index.toString()); 
            return prev;
        });
    }

    useEffect(() => {
        (async () => {
            await onChangeYear(Number(searchParams.get("year")) || new Date().getFullYear());
        })();
    }, []);

    return (
        <Context.Provider value={{
            drivers, rounds, round, years, year, 
            onChangeYear, onChangeRound }}>
            {children}
        </Context.Provider>
    );
};