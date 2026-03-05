import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { Driver, Round } from '../utils/types';
import { getDrivers, getRound } from '../utils/data';

interface ContextType {
    drivers: Driver[];
    setDrivers: (drivers: Driver[]) => void;

    round: Round | undefined;
    setRound: (round: Round) => void;
}

export const Context = createContext<ContextType | undefined>(undefined);

export const ContextProvider = ({ children }: { children: ReactNode }) => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [round, setRound] = useState<Round | undefined>();

    useEffect(() => {
        getDrivers().then((drivers) => {
            setDrivers(drivers)
        })

        getRound(1).then((round) => {
            setRound(round)
        })
    }, [])

    return (
        <Context.Provider value={{ drivers, setDrivers, round, setRound}}>
            {children}
        </Context.Provider>
    );
};