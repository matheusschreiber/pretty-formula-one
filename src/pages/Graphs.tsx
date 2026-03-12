import { useContext, useEffect, useState } from "react";
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

    const [driverId, setDriverId] = useState<string>("");
    useEffect(() => {
        const found = drivers.find(d => d.id === driverId)
        if (found) setSelectedDriver(found);
    }, [driverId])

    const context = useContext(Context)!;
    if (!context) return <></>
    const { 
        drivers, rounds, round, year, setYear, 
        yearsAvailable, roundIdx, setRoundIdx,
        selectedDriver, setSelectedDriver
    } = context;    

    useEffect(() => {
        if (!selectedDriver || !roundIdx) return;
        getTelemetryData(selectedDriver.id, roundIdx).then((rawCsv: string) => {
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
        });
    }, [year, roundIdx]);

    function formatElapsedTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
    }

    return (
        <div className="w-full min-h-[110vh]">
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
                        selectedOption={{ id: selectedDriver?.id, name: selectedDriver?.name }} />
                )}
                {round && (
                    <CustomSelect 
                        onSelect={(value) => setRoundIdx(value)} 
                        options={rounds.sort((a, b) => a.name.localeCompare(b.name))} 
                        selectedOption={{ id: round.index, name: round.name }}/>
                )}
            </div>

            {telemetryData && telemetryData.length > 0 && (
                <p className="text-center w-full text-gray-light">
                    Showing the fastest Lap of {selectedDriver?.name} 
                    <strong className="text-red-500 ml-5">
                        {formatElapsedTime(telemetryData[telemetryData.length - 1].seconds)}
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

           
        </div>
    )
}