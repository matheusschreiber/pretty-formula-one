import { useEffect, useState } from "react";
import { getTelemetryData } from "./utils/data";

import BrakeThrottleGraph from "./components/graphs/brake-trottle";
import TrackMap from "./components/graphs/trackmap";
import { useTelemetryTimer } from "./hooks/useTelemetryTimer";

export interface TelemetryPoint {
    seconds: number;
    x: number;
    y: number;
    speed: number;
    throttle: number;
    brake: boolean;
}

export default function Graphs(){

    const [telemetryData, setTelemetryData] = useState<TelemetryPoint[]>([]);
    
    const maxTime = telemetryData.length > 0 ? telemetryData[telemetryData.length - 1].seconds : 0;
    const currentTime = useTelemetryTimer(maxTime);

    useEffect(() => {
        getTelemetryData().then((rawCsv: string) => {
            const rows = rawCsv.trim().split('\n').slice(1);
            const parsedData = rows.map(row => {
                const col = row.split(',');
                return {
                    seconds: parseFloat(col[0]),
                    x: parseFloat(col[1]),
                    y: parseFloat(col[2]),
                    speed: parseFloat(col[5]),
                    throttle: parseFloat(col[7]),
                    brake: col[8] == 'True',
                };
            });
            setTelemetryData(parsedData);
        });
    }, []);

    return (

        <div className="w-full flex items-center justify-center p-8">
            <TrackMap telemetryData={telemetryData} currentTime={currentTime} />

            <BrakeThrottleGraph telemetryData={telemetryData} currentTime={currentTime}/>
        </div>
    )
}