import { useContext, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LineChart, Table2 } from "lucide-react";
import { Context } from "../components/context-provider";
import { getDriverStandingEvolution, getStandingsPerRound, type DriverStandings, type RoundStandings } from "../utils/championship";
import ChampionshipStandingsGraph from "../components/tables/championship-standings";
import CustomSelect from "../components/graphs/select";
import Loading from "../components/loading";
import Header from "../components/header";
import ChampionshipStandingsTable from "../components/tables/championship-standings-table";

interface AllStandingsData {
    standingsPerRound: RoundStandings[];
    driverStandingsEvolution: DriverStandings[];
}

type TabId = "graph" | "table";

const TABS: { id: TabId; label: string; icon: typeof LineChart }[] = [
    { id: "graph", label: "Evolution Graph", icon: LineChart },
    { id: "table", label: "Standings Table", icon: Table2 },
];

export default function Championship() {
    const [searchParams] = useSearchParams();

    const { rounds, years, year, onChangeYear } = useContext(Context);

    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<TabId>("graph");

    const data = useMemo<AllStandingsData>(() => ({
        standingsPerRound: getStandingsPerRound(rounds),
        driverStandingsEvolution: getDriverStandingEvolution(rounds),
    }), [rounds]);

    async function changeYear(yearNumber: number) {
        setLoading(true);
        await onChangeYear(yearNumber);
        setLoading(false);
    }

    useEffect(()=>{
        changeYear(Number(searchParams.get("year")) || new Date().getFullYear());
    }, []);
    
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
                    onSelect={(value) => changeYear(Number(value))}
                    options={years.map((y) => ({ id: y.toString(), name: y.toString() }))}
                    selectedOption={{ id: year.toString(), name: year.toString() }} />
            </div>

            <div>
                <div className="flex justify-center mb-8">
                    <div className="relative inline-flex items-center gap-1 p-1.5 bg-zinc-900/80 border border-gray-primary rounded-full shadow-xl backdrop-blur-sm">
                        {TABS.map(({ id, label, icon: Icon }) => {
                            const isActive = activeTab === id;
                            return (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium cursor-pointer
                                        transition-colors duration-300
                                        ${isActive ? "text-white" : "text-gray-light hover:text-white"}`}
                                >
                                    {isActive && (
                                        <motion.span
                                            layoutId="tab-pill"
                                            className="absolute inset-0 rounded-full bg-primary shadow-[0_0_20px_rgba(225,6,0,0.55)]"
                                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                        />
                                    )}
                                    <Icon size={16} className="relative z-10" />
                                    <span className="relative z-10">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-10 mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {activeTab === "graph" && (
                                <ChampionshipStandingsGraph
                                    standingsPerRound={data.standingsPerRound}
                                    driverStandingsEvolution={data.driverStandingsEvolution} />
                            )}

                            {activeTab === "table" && (
                                <ChampionshipStandingsTable
                                    driverStandingsEvolution={data.driverStandingsEvolution} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

        </div>
    )
}