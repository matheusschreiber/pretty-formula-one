import { useContext, useMemo } from "react";
import { Context } from "../components/context-provider";
import { getDriverStandingEvolution, getStandingsPerRound, type DriverStandings, type RoundStandings } from "../utils/championship";
import ChampionshipStandingsGraph from "../components/graphs/championship-standings";
import { useSearchParams } from "react-router-dom";
import CustomSelect from "../components/graphs/select";
import Loading from "../components/loading";
import Header from "../components/header";
import ChampionshipStandingsTable from "../components/graphs/championship-standings-table";

interface AllStandingsData {
    standingsPerRound: RoundStandings[];
    driverStandingsEvolution: DriverStandings[];
}

export default function Championship() {

    const { rounds, years } = useContext(Context);

    const [searchParams, setSearchParams] = useSearchParams();

    const data = useMemo<AllStandingsData>(() => ({
        standingsPerRound: getStandingsPerRound(rounds),
        driverStandingsEvolution: getDriverStandingEvolution(rounds),
    }), [rounds]);
    
    const targetYear = Number(searchParams.get("year"));
    const loading = rounds.length === 0 || rounds[0].year !== targetYear;
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
                    selectedOption={{ id: searchParams.get("year")?.toString(), name: searchParams.get("year")?.toString() }} />

            </div>

            <div className="flex flex-col gap-10">
                <ChampionshipStandingsGraph 
                    standingsPerRound={data.standingsPerRound} 
                    driverStandingsEvolution={data.driverStandingsEvolution} />
                    
                <ChampionshipStandingsTable 
                    driverStandingsEvolution={data.driverStandingsEvolution} />
            </div>
        </div>
    )
}