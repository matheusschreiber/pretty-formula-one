import { useMemo } from 'react';
import type { TelemetryData, TelemetryPoint } from '../../pages/Graphs';

interface TrackMapProps {
    telemetryData: TelemetryData;
    currentTime: number;
}

export default function TrackMap({ telemetryData, currentTime }: TrackMapProps) {    
    
    const car1Pos = useMemo(() => {
        if (telemetryData.driver1.length < 2) return { x: 0, y: 0, speed: 0 };

        let i = telemetryData.driver1.findIndex(p => p.seconds > currentTime);
        if (i <= 0) i = 1;

        const p0 = telemetryData.driver1[i - 1];
        const p1 = telemetryData.driver1[i];

        const alpha = (currentTime - p0.seconds) / (p1.seconds - p0.seconds);

        return {
            x: p0.x + (p1.x - p0.x) * alpha,
            y: p0.y + (p1.y - p0.y) * alpha,
            speed: p0.speed + (p1.speed - p0.speed) * alpha,
        };
    }, [telemetryData, currentTime]);

    const car2Pos = useMemo(() => {
        if (telemetryData.driver2.length < 2) return { x: 0, y: 0, speed: 0 };

        let i = telemetryData.driver2.findIndex(p => p.seconds > currentTime);
        if (i <= 0) i = 1;

        const p0 = telemetryData.driver2[i - 1];
        const p1 = telemetryData.driver2[i];

        const alpha = (currentTime - p0.seconds) / (p1.seconds - p0.seconds);

        return {
            x: p0.x + (p1.x - p0.x) * alpha,
            y: p0.y + (p1.y - p0.y) * alpha,
            speed: p0.speed + (p1.speed - p0.speed) * alpha,
        };
    }, [telemetryData, currentTime]);

    const formattedTime = useMemo(() => {
        const minutes = Math.floor(currentTime / 60);
        const seconds = (currentTime % 60).toFixed(2);
        return `${minutes}:${seconds.padStart(5, '0')}`;
    }, [currentTime]);

    const bounds = useMemo(() => {
        var auxBounds = {minX: 0, maxX: 0, minY: 0, maxY: 0};
        Object.entries(telemetryData).forEach(([_, value]) => {
            if (typeof(value) == "string") return;
            if (value.length === 0) {
                auxBounds = { 
                    minX: Math.min(0, auxBounds.minX),
                    maxX: Math.max(0, auxBounds.maxX),
                    minY: Math.min(0, auxBounds.minY),
                    maxY: Math.max(0, auxBounds.maxY),
                };
            }
            const xs = (value as TelemetryPoint[]).map(p => p.x);
            const ys = (value as TelemetryPoint[]).map(p => p.y);
            auxBounds = { 
                minX: Math.min(auxBounds.minX, ...xs), 
                maxX: Math.max(auxBounds.maxX, ...xs), 
                minY: Math.min(auxBounds.minY, ...ys), 
                maxY: Math.max(auxBounds.maxY, ...ys) 
            };
        })
        return auxBounds;
    }, [telemetryData]);

    const linePath = useMemo(() => {
        return telemetryData.driver1.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    }, [telemetryData]);

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const padding = Math.max(width, height) * 0.1;

    if (!telemetryData || telemetryData.driver1.length === 0 || telemetryData.driver2.length === 0) {
        return (
            <p>No data to be shown.</p>
        )
    }

    return (
        <div className='max-w-175 h-138'>
            <div className="relative w-full h-125">
                <svg
                    viewBox={`${bounds.minX - padding} ${bounds.minY - padding} ${width + padding * 2} ${height + padding * 2}`}
                    className="w-full h-full"
                    style={{ transform: 'scaleY(-1)' }}
                >
                    <path d={linePath} fill="none" stroke="#ff0000" strokeWidth={width * 0.005} />

                    <circle 
                        cx={car1Pos.x} 
                        cy={car1Pos.y} 
                        r={width * 0.012} 
                        fill="white"
                        className="drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    />

                    <circle 
                        cx={car2Pos.x} 
                        cy={car2Pos.y} 
                        r={width * 0.012} 
                        fill="gray"
                        className="drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    />
                </svg>
            </div>

            <div className="flex gap-10">
                <div className="flex gap-2 items-center">
                    <div className="h-3 w-3 bg-white rounded-full"></div> 
                    <p className="text-gray-light text-xs uppercase tracking-widest">
                        {telemetryData.driver1Name}: <span className="text-white font-bold font-sans tabular-nums">{Math.round(car1Pos.speed)} KM/H</span>
                    </p>
                </div>
  
                <div className="flex gap-2 items-center">
                    <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                    <p className="text-gray-light text-xs uppercase tracking-widest">
                        {telemetryData.driver2Name}: <span className="text-white font-bold font-sans tabular-nums">{Math.round(car2Pos.speed)} KM/H</span>
                    </p>
                </div>
                <p className="text-gray-light text-xs uppercase tracking-widest">
                    Time: <span className="text-white font-bold font-sans tabular-nums">{formattedTime}</span>
                </p>
            </div>

        </div>
    );
}
        