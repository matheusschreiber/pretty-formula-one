import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { Driver, Round } from '../utils/types';
import { getData } from '../utils/data';

interface ContextType {
    drivers: Driver[];
    setDrivers: (drivers: Driver[]) => void;

    round: Round | undefined;
    setRound: (round: Round) => void;

    year: number;
    setYear: (year: number) => void;

    roundIdx: number;
    setRoundIdx: (roundIdx: number) => void;

    rounds: Round[];
}

export const Context = createContext<ContextType | undefined>(undefined);

export const ContextProvider = ({ children }: { children: ReactNode }) => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [round, setRound] = useState<Round | undefined>();
    const [rounds, setRounds] = useState<Round[]>([]);

    const [year, setYear] = useState<number>(2024);
    const [roundIdx, setRoundIdx] = useState<number>(2);

    useEffect(() => {
        getData(year, roundIdx, drivers, rounds).then((data) => {
            setRound(data.round)
            setRounds(data.rounds)
            setDrivers(data.drivers)
        })
    }, [year, roundIdx])

    return (
        <Context.Provider value={{ drivers, setDrivers, round, setRound, year, setYear, roundIdx, setRoundIdx, rounds}}>
            {children}
        </Context.Provider>
    );
};