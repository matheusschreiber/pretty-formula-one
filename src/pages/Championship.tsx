import { useContext, useEffect, useState } from "react";
import { Context } from "../components/context-provider";
import { getChampionshipStandings, type RoundStandings } from "../utils/championship";
import ChampionshipStandingsGraph from "../components/graphs/championship-standings";
import { useSearchParams } from "react-router-dom";
import CustomSelect from "../components/graphs/select";
import Loading from "../components/loading";
import Header from "../components/header";

export default function Championship() {

    const context = useContext(Context);
    const { rounds, years, year, setYear } = context;

    const [standingsPerRound, setStandingsPerRound] = useState<RoundStandings[]>([]);

    const  [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        if (searchParams.get("year")) {
            setYear(Number(searchParams.get("year")));
            setLoading(true)
        }
    }, [searchParams]);

    useEffect(()=>{
        let standings = getChampionshipStandings(rounds)
        setStandingsPerRound(standings)
        setLoading(false)
    }, [rounds]);

    if (loading) return <Loading />;

    return (
        <div className="w-full min-h-screen p-5">
            <Header />
            
            <div className="flex items-center my-5 justify-center">
                <a href="/" className="mr-20">
                    <button className="px-5 py-2 bg-zinc-900 border border-gray-primary rounded-lg shadow-xl cursor-pointer
                    hover:bg-zinc-800 transition-all duration-300 scale-100 hover:scale-105">
                        Go back
                    </button>
                </a>

                <CustomSelect
                    onSelect={(value) => setSearchParams(prev => {
                        prev.set("year", value);
                        return prev;
                    })}
                    options={years.map((y) => ({ id: y.toString(), name: y.toString() }))}
                    selectedOption={{ id: year.toString(), name: year.toString() }} />

            </div>



            <ChampionshipStandingsGraph standingsPerRound={standingsPerRound} />
        </div>
    )
}