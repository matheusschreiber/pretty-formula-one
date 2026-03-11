import { useContext, useEffect, useState } from "react";
import { getTelemetryData } from "../utils/data";

import BrakeThrottleGraph from "../components/graphs/brake-trottle";
import TrackMap from "../components/graphs/trackmap";
import { useTelemetryTimer } from "../hooks/useTelemetryTimer";
import Header from "../components/header";
import CustomSelect from "../components/graphs/select";
import { Context } from "../components/context-provider";
import RPMGraph from "../components/graphs/rpm";
import ElevationGraph from "../components/graphs/elevation";

export interface TelemetryPoint {
    seconds: number;
    x: number;
    y: number;
    z: number;
    speed: number;
    throttle: number;
    brake: boolean;
    rpm: number;
}

export default function Graphs() {

    const [telemetryData, setTelemetryData] = useState<TelemetryPoint[]>([]);

    const maxTime = telemetryData.length > 0 ? telemetryData[telemetryData.length - 1].seconds : 0;
    const currentTime = useTelemetryTimer(maxTime);

    const [driverId, setDriverId] = useState<string>("");

    const context = useContext(Context)!;
    if (!context) return <></>
    const { 
        drivers, rounds, round, year, setYear, 
        yearsAvailable, roundIdx, setRoundIdx
    } = context;    

    useEffect(() => {
        if (!driverId || !roundIdx) return;

        getTelemetryData(driverId, roundIdx).then((rawCsv: string) => {
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
                    throttle: parseFloat(col[7]),
                    brake: col[8] == 'True',
                };
            });
            setTelemetryData(parsedData);
        });
    }, [driverId, roundIdx]);

    return (
        <>
            <Header />

            <div className="w-full flex items-center my-10 justify-center gap-5">
                <CustomSelect 
                    onSelect={(value) => setYear(value)} 
                    options={yearsAvailable.map((a) => ({ id: a.toString(), name: a.toString() }))} 
                    selectedOption={{ id: year.toString(), name: year.toString() }} />
                {drivers.length > 0 && (
                    <CustomSelect 
                        onSelect={(value) => setDriverId(value)} 
                        options={drivers.sort((a, b) => a.name.localeCompare(b.name))} 
                        selectedOption={{ id: drivers[0].id, name: drivers[0].name }} />
                )}
                {round && (
                    <CustomSelect 
                        onSelect={(value) => setRoundIdx(value)} 
                        options={rounds.sort((a, b) => a.name.localeCompare(b.name))} 
                        selectedOption={{ id: round.index, name: round.name }}/>
                )}
            </div>

            <div className="w-full flex justify-center p-8">
                <TrackMap telemetryData={telemetryData} currentTime={currentTime} />
                <div className="flex flex-col gap-10">
                    <BrakeThrottleGraph telemetryData={telemetryData} currentTime={currentTime} />
                    <div className="flex gap-10">
                        <RPMGraph telemetryData={telemetryData} currentTime={currentTime} />
                        <ElevationGraph telemetryData={telemetryData} currentTime={currentTime} />
                    </div>
                </div>
            </div>
        </>
    )
}