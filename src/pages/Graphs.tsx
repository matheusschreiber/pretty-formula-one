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

export interface TelemetryData {
    driver1: TelemetryPoint[];
    driver1Name: string;
    driver2: TelemetryPoint[];
    driver2Name: string;
}

export default function Graphs() {

    const [telemetryData, setTelemetryData] = useState<TelemetryData>({ driver1: [], driver1Name: "", driver2: [], driver2Name: "" });

    const maxTime = Math.max(
        telemetryData.driver1.length > 0 ? telemetryData.driver1[telemetryData.driver1.length - 1].seconds : 0,
        telemetryData.driver2.length > 0 ? telemetryData.driver2[telemetryData.driver2.length - 1].seconds : 0
    );
    const currentTime = useTelemetryTimer(maxTime);

    const context = useContext(Context);
    const { drivers, rounds, years, year, setYear } = context;

    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    const [driver1, setDriver1] = useState<Driver>();
    const [driver2, setDriver2] = useState<Driver>();
    const [round, setRound] = useState<Round>();

    const [dnfDriverId, setDNFDriverId] = useState<string | null>(null);

    useEffect(() => {
        if (years.length === 0 || drivers.length === 0 || rounds.length === 0) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const rawDriver1Param = searchParams.get("driver1");
        const foundDriver1 = drivers.find(d => d.id === rawDriver1Param) ?? drivers[0];
        setDriver1(foundDriver1);

        const rawDriver2Param = searchParams.get("driver2");
        const foundDriver2 = drivers.find(d => d.id === rawDriver2Param) ?? drivers[0];
        setDriver2(foundDriver2);

        const rawYearParam = searchParams.get("year");
        const foundYear = years.find(y => y.toString() === rawYearParam) ?? years[0];
        setYear(foundYear);

        const rawRoundParam = searchParams.get("round");
        const foundRound = rounds.find(r => r.index.toString() === rawRoundParam) ?? rounds[0];
        setRound(foundRound);

        setLoading(false);
    }, [searchParams, years, drivers, rounds]);

    async function fetchTelemetryData(driverId: string, roundIndex: number) {
        const rawCsv = await getTelemetryData(driverId, roundIndex);
        const rows = rawCsv.trim().split('\n').slice(1);
        return rows.map(row => {
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
    }

    async function getTelemetry(driver1: Driver, driver2: Driver, round: Round) {
        const driver1ParsedData = await fetchTelemetryData(driver1.id, round.index);
        const driver2ParsedData = await fetchTelemetryData(driver2.id, round.index);

        return {
            driver1: driver1ParsedData,
            driver1Name: driver1.name,
            driver2: driver2ParsedData,
            driver2Name: driver2.name,
        };
    }

    useEffect(() => {
        if (!year || !driver1 || !driver2 || !round) {
            setLoading(false);
            return;
        }

        setLoading(true);

        setDNFDriverId(null);
        round.results.forEach(result => {
            if (result.driver_id == driver1.id || result.driver_id == driver2.id) {
                if (result.retired) {
                    setDNFDriverId(result.driver_id);
                }
            }
        })
        
        getTelemetry(driver1, driver2, round).then((telemetry) => {
            setTelemetryData(telemetry);
            setLoading(false);
        });

    }, [driver1, driver2, round]);

    function formatElapsedTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
    }

    if (loading) {
        return <Loading />;
    }

    if (years.length === 0 || drivers.length === 0 || rounds.length === 0 || !year || !driver1 || !driver2 || !round) {
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
                    driver1 && (
                        <CustomSelect
                            onSelect={(value) => setSearchParams(prev => {
                                prev.set("driver1", value);
                                return prev;
                            })}
                            options={drivers.sort((a, b) => a.name.localeCompare(b.name))}
                            selectedOption={{ id: driver1.id, name: driver1.name }} />
                    )
                }
                {
                    driver2 && (
                        <CustomSelect
                            onSelect={(value) => setSearchParams(prev => {
                                prev.set("driver2", value);
                                return prev;
                            })}
                            options={drivers.sort((a, b) => a.name.localeCompare(b.name))}
                            selectedOption={{ id: driver2.id, name: driver2.name }} />
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

            {dnfDriverId && (
                <p className="text-center">
                    The driver <strong>{dnfDriverId || "---"}</strong> didn't finish
                    the <strong> {year} {round?.name || "---"}</strong>.
                </p>
            )}

            {telemetryData && telemetryData.driver1.length > 0 && 
                telemetryData.driver2.length > 0 && !dnfDriverId && (
                <>
                    <p className="text-center w-full text-gray-light">
                        Showing the fastest Lap of <strong>{driver1?.name || "---"}</strong> ({" "}
                        <strong className="text-red-500">
                            {formatElapsedTime(telemetryData.driver1[telemetryData.driver1.length - 1].seconds) || "---"}
                        </strong>) and <strong>{driver2?.name || "---"}</strong> ({" "}
                        <strong className="text-red-500">
                            {formatElapsedTime(telemetryData.driver2[telemetryData.driver2.length - 1].seconds) || "---"}
                        </strong>) on the
                        <strong> {year} {round?.name || "---"}</strong>.
                    </p>
                    <div className="w-full flex justify-center p-8 gap-10">
                        <div className="flex flex-col gap-10">
                            <TrackMap telemetryData={telemetryData} currentTime={currentTime} />
                            <div className="w-full flex justify-center gap-10">
                                <GearGraph telemetryData={telemetryData} currentTime={currentTime} />
                                <TyreGraph telemetryData={telemetryData} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-10">
                            <BrakeThrottleGraph telemetryData={telemetryData} currentTime={currentTime} />
                            <div className="flex gap-10">
                                <RPMGraph telemetryData={telemetryData} currentTime={currentTime} />
                                <AltitudeGraph telemetryData={telemetryData} currentTime={currentTime} />
                            </div>
                            <SpeedGraph telemetryData={telemetryData} currentTime={currentTime} />
                        </div>
                    </div>
                    
                </>
            )}

            <Footer />
        </div>

    )
}