import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { Driver, Round } from '../utils/types';
import { getData, getYearsAvailable } from '../utils/data';

interface ContextType {
    drivers: Driver[];
    setDrivers: (drivers: Driver[]) => void;

    selectedDriver: Driver | undefined,
    setSelectedDriver: (driver: Driver) => void;

    round: Round | undefined;
    setRound: (round: Round) => void;

    year: number;
    setYear: (year: number) => void;
    yearsAvailable: number[];

    roundIdx: number;
    setRoundIdx: (roundIdx: number) => void;

    rounds: Round[];
}

export const Context = createContext<ContextType | undefined>(undefined);

export const ContextProvider = ({ children }: { children: ReactNode }) => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedDriver, setSelectedDriver] = useState<Driver>();
    const [round, setRound] = useState<Round | undefined>();
    const [rounds, setRounds] = useState<Round[]>([]);

    const [yearsAvailable, setYearsAvailable] = useState<number[]>([]);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [roundIdx, setRoundIdx] = useState<number>(1);

    useEffect(()=>{
        if (!yearsAvailable || yearsAvailable.length == 0) {
            getYearsAvailable().then((years) => {
                setYearsAvailable(years);
            });
        }
    }, []);

    useEffect(() => {
        getData(year, roundIdx, drivers, rounds).then((data) => {
            setRound(data.round)
            setRounds(data.rounds)
            setDrivers(data.drivers)
        })
    }, [year, roundIdx])

    return (
        <Context.Provider value={{ 
            drivers, setDrivers, round,
            selectedDriver, setSelectedDriver, 
            setRound, year, setYear, 
            yearsAvailable, roundIdx, 
            setRoundIdx, rounds}}>
            {children}
        </Context.Provider>
    );
};