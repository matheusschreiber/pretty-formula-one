import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getTelemetryData } from "../utils/data";

import BrakeThrottleGraph from "../components/graphs/brake-trottle";
import TrackMap from "../components/graphs/trackmap";
import { useTelemetryTimer } from "../hooks/useTelemetryTimer";
import Header from "../components/header";
import CustomSelect from "../components/graphs/select";
import { Context } from "../components/context-provider";
import RPMGraph from "../components/graphs/rpm";
import AltitudeGraph from "../components/graphs/altitude";
import GearGraph from "../components/graphs/gear";
import TyreGraph from "../components/graphs/tyre";
import SpeedGraph from "../components/graphs/speed";
import type { Driver, Round } from "../utils/types";
import Footer from "../components/footer";
import Loading from "../components/loading";

export interface TelemetryPoint {
    seconds: number;
    x: number;
    y: number;
    z: number;
    speed: number;
    gear: number;
    throttle: number;
    brake: boolean;
    rpm: number;
    drs: number;
    compound: string;
}

export default function Graphs() {

    const [telemetryData, setTelemetryData] = useState<TelemetryPoint[]>([]);

    const maxTime = telemetryData.length > 0 ? telemetryData[telemetryData.length - 1].seconds : 0;
    const currentTime = useTelemetryTimer(maxTime);

    const context = useContext(Context);
    const { drivers, rounds, years, year, setYear } = context;
    
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    // const [year, setYear] = useState<number>();
    const [driver, setDriver] = useState<Driver>();
    const [round, setRound] = useState<Round>();

    useEffect(() => {
        if (years.length === 0 || drivers.length === 0 || rounds.length === 0) {
            setLoading(false);
            return;
        }
        
        setLoading(true);

        const rawDriverParam = searchParams.get("driver");
        const foundDriver = drivers.find(d => d.id === rawDriverParam) ?? drivers[0];
        setDriver(foundDriver);

        const rawYearParam = searchParams.get("year");
        const foundYear = years.find(y => y.toString() === rawYearParam) ?? years[0];
        setYear(foundYear);

        const rawRoundParam = searchParams.get("round");
        const foundRound = rounds.find(r => r.index.toString() === rawRoundParam) ?? rounds[0];
        setRound(foundRound);

        setLoading(false);
    }, [searchParams, years, drivers, rounds]);

    useEffect(() => {
        if (!year || !driver || !round) {
            setLoading(false);
            return;
        }

        setLoading(true);
        getTelemetryData(driver.id, round.index).then((rawCsv: string) => {
            const rows = rawCsv.trim().split('\n').slice(1);
            const parsedData = rows.map(row => {
                const col = row.split(',');
                return {
                    seconds: parseFloat(col[0]),
                    x: parseFloat(col[1]),
                    y: parseFloat(col[2]),
                    z: parseFloat(col[3]),
                    rpm: parseFloat(col[4]),
                    speed: parseFloat(col[5]),
                    gear: parseInt(col[6]),
                    throttle: parseFloat(col[7]),
                    brake: col[8] == 'True',
                    drs: parseFloat(col[9]),
                    compound: col[11],
                };
            });
            setTelemetryData(parsedData);
            setLoading(false);
        });
    }, [driver, round]);

    function formatElapsedTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
    }

    if (loading) {
        return <Loading />;
    }

    if (years.length === 0 || drivers.length === 0 || rounds.length === 0 || !year || !driver || !round) {
        return (
            <div className="w-full min-h-screen flex flex-col items-center justify-center gap-5">
                <h1 className="text-2xl text-red-500 font-bold">An error occurred while loading the data.</h1>
                <p className="text-gray-light">Please try again later or check your internet connection.</p>
                <a href="/" className="px-5 py-2 bg-zinc-900 border border-gray-primary rounded-lg shadow-xl cursor-pointer
                    hover:bg-zinc-800 transition-all duration-300 scale-100 hover:scale-105">
                    Go back
                </a>
            </div>
        )
    }

    return (
        <div className="w-full min-h-[110vh]">
            <Header />

            <div className="w-full flex items-center my-10 justify-center gap-5">
            
                <a href="/" className="mr-20">
                    <button className="px-5 py-2 bg-zinc-900 border border-gray-primary rounded-lg shadow-xl cursor-pointer
                    hover:bg-zinc-800 transition-all duration-300 scale-100 hover:scale-105">
                        Go back
                    </button>
                </a>

                {
                    year && (
                        <CustomSelect
                            onSelect={(value) => setSearchParams(prev => {
                                prev.set("year", value);
                                return prev;
                            })}
                            options={years.map((y) => ({ id: y.toString(), name: y.toString() }))}
                            selectedOption={{ id: year.toString(), name: year.toString() }} />
                    )
                }
                {
                    driver && (
                        <CustomSelect
                            onSelect={(value) => setSearchParams(prev => {
                                prev.set("driver", value);
                                return prev;
                            })}
                            options={drivers.sort((a, b) => a.name.localeCompare(b.name))}
                            selectedOption={{ id: driver.id, name: driver.name }} />
                    )
                }
                {
                    round && (
                        <CustomSelect
                            onSelect={(value) => setSearchParams(prev => {
                                prev.set("round", value);
                                return prev;
                            })}
                            options={rounds.sort((a, b) => a.name.localeCompare(b.name))}
                            selectedOption={{ id: round.index, name: round.name }} />
                    )
                }
            </div>

            {telemetryData && telemetryData.length > 0 && (
                <p className="text-center w-full text-gray-light">
                    Showing the fastest Lap of <strong>{driver?.name || "---"}</strong> on the
                    <strong> {year} {round?.name || "---"}</strong>, with a time of {" "}
                    <strong className="text-red-500">
                        {formatElapsedTime(telemetryData[telemetryData.length - 1].seconds) || "---"}
                    </strong>
                </p>
            )}

            <div className="w-full flex justify-center p-8 gap-10">
                <TrackMap telemetryData={telemetryData} currentTime={currentTime} />
                <div className="flex flex-col gap-10">
                    <BrakeThrottleGraph telemetryData={telemetryData} currentTime={currentTime} />
                    <div className="flex gap-10">
                        <RPMGraph telemetryData={telemetryData} currentTime={currentTime} />
                        <AltitudeGraph telemetryData={telemetryData} currentTime={currentTime} />
                        <GearGraph telemetryData={telemetryData} currentTime={currentTime} />
                    </div>
                    <div className="w-full flex justify-center gap-10">
                        <TyreGraph telemetryData={telemetryData} />
                        <SpeedGraph telemetryData={telemetryData} currentTime={currentTime} />
                    </div>
                </div>
            </div>

            <div className="min-h-screen"></div>

            <Footer />
        </div>

    )
}