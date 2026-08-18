import { useContext, useEffect, useState } from 'react';

import { getReplayData } from '../utils/data';
import { Context } from '../components/context-provider';

import Header from '../components/header';
import Loading from '../components/loading';
import { type ReplayRecord } from '../components/replays/leaderboard';
import Footer from '../components/footer';
import CustomSelect from '../components/graphs/select';
import { useSearchParams } from 'react-router-dom';
import ReplayTable from '../components/replays/replay-table';

export default function Replay() {
    const { drivers, year, round, rounds, years, 
        onChangeYear, onChangeRound
    } = useContext(Context);

    const [_, setSearchParams] = useSearchParams();
    const [records, setRecords] = useState<ReplayRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string>('');

    async function fetchReplayData(year: number, roundIdx: number) {
        if (!year || !roundIdx) {
            setErrorMsg('Year or round not specified.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setErrorMsg('');
        setRecords([]);

        try {
            const all = await getReplayData(year, roundIdx);
            if (all.length === 0) {
                setErrorMsg('No replay data available for this round.');
            } else {
                setRecords(all as unknown as ReplayRecord[]);
            }
        } catch {
            setRecords([]);
            setErrorMsg('Failed to load replay data.');
        } finally {
            setLoading(false);
        }
    }

    async function changeYear(newYear: number) {
        setSearchParams(prev => {
            prev.set("year", newYear.toString());
            return prev;
        });
        await onChangeYear(newYear);
    }

    async function changeRound(newRoundIndex: number) {
        setSearchParams(prev => {
            prev.set("round", newRoundIndex.toString());
            return prev;
        });
        await onChangeRound(newRoundIndex);
    }

    useEffect(()=>{
        fetchReplayData(year, round.index);
    }, [year, round]);

    if (loading) return <Loading />;

    return (
        <div className="w-full flex flex-col">
            <Header />
            <div className="flex-1 min-h-0 max-w-280 w-full mx-auto px-4 md:px-6 pb-3 flex flex-col">
                <div className="flex gap-5 my-2 mt-10 mb-5">
                    <a href="/">
                        <button className="px-5 py-3 bg-zinc-900 border border-gray-primary rounded-lg shadow-xl cursor-pointer
                        hover:bg-zinc-800 transition-all duration-300 scale-100 hover:scale-105">
                            Go back
                        </button>
                    </a>
                    {
                        year && (
                            <CustomSelect
                                onSelect={(value) => changeYear(Number(value))}
                                options={years.map((y) => ({ id: y.toString(), name: y.toString() }))}
                                selectedOption={{ id: year.toString(), name: year.toString() }} />
                        )
                    }
                    {
                        round && (
                            <CustomSelect
                                onSelect={(value) => changeRound(Number(value))}
                                options={rounds.map((r) => ({ ...r, name: r.index.toString() + ' - ' + r.name.toString() }))}
                                selectedOption={{ id: round.index, name: round.name }} />
                        )
                    }
                </div>
                <h1 className="text-xl mb-3 font-bold tracking-wide mt-10">
                    REPLAYED LEADERBOARD - <span className="text-red-500 uppercase">
                        {round.name} - {year}
                    </span>
                </h1>
                
                <ReplayTable 
                    records={records}
                    drivers={drivers}
                    round={round}
                    errorMsg={errorMsg}
                />
            </div>
            <Footer/>
        </div>
    );
}
