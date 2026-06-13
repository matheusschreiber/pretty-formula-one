import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { Driver, Round } from '../utils/types';
import { getDrivers, getResults, getRounds, getYears } from '../utils/data';

interface ContextType {
    loading: boolean;
    
    drivers: Driver[];
    
    rounds: Round[];
    round: Round;
    setRound: (round: Round) => void; 

    years: number[];
    year: number;
    setYear: (year: number) => void;
}

const initialContext: ContextType = {
    loading: false,
    
    drivers: [],

    rounds: [],
    round: {} as Round,
    setRound: () => {},
    
    years: [],
    year: new Date().getFullYear(),
    setYear: () => {},
};

export const Context = createContext<ContextType>(initialContext);

export const ContextProvider = ({ children }: { children: ReactNode }) => {

    const [loading, setLoading] = useState(false);
    
    const [drivers, setDrivers] = useState<Driver[]>([]);

    const [rounds, setRounds] = useState<Round[]>([]);
    const [round, setRound] = useState<Round>({} as Round);
    
    const [years, setYears] = useState<number[]>([]);    
    const [year, setYear] = useState<number>(new Date().getFullYear());

    const fetchRoundsAndDrivers = async () => {
        try {
            const responseDrivers = await getDrivers(year)
            const responseRounds = await getRounds(year)
            const selectedRound = responseRounds[0]
            const responseResults = await getResults(selectedRound.index, responseDrivers, responseRounds);
            setDrivers(responseResults.drivers);
            setRound(responseResults.round);
            setRounds(responseResults.rounds);
        } catch (error) {
            console.error(error);
        }
    }

    const fetchYears = async () => {
        setLoading(true);
        try {
            const responseYears = await getYears();
            setYears(responseYears);
            const lastYear = responseYears.slice(-1)[0];
            setYear(lastYear);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoundResults = async () => {
        try {
            const responseResults = await getResults(round.index, drivers, rounds);
            setDrivers(responseResults.drivers);
            setRounds(responseResults.rounds);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchYears();
    }, []);

    useEffect(() => {
        fetchRoundsAndDrivers()
    }, [year]);

    useEffect(()=>{
        fetchRoundResults()
    }, [round])

    return (
        <Context.Provider value={{
            loading,
            drivers,
            rounds, round, setRound, 
            years, year, setYear,
        }}>
            {children}
        </Context.Provider>
    );
};