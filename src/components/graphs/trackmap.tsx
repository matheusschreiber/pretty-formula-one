import { useMemo } from 'react';
import type { TelemetryPoint } from '../../Graphs';

interface TrackMapProps {
    telemetryData: TelemetryPoint[];
    currentTime: number;
}

export default function TrackMap({ telemetryData, currentTime }: TrackMapProps) {    
    
    const carPos = useMemo(() => {
        if (telemetryData.length < 2) return { x: 0, y: 0, speed: 0 };

        let i = telemetryData.findIndex(p => p.seconds > currentTime);
        if (i <= 0) i = 1;

        const p0 = telemetryData[i - 1];
        const p1 = telemetryData[i];

        const alpha = (currentTime - p0.seconds) / (p1.seconds - p0.seconds);

        return {
            x: p0.x + (p1.x - p0.x) * alpha,
            y: p0.y + (p1.y - p0.y) * alpha,
            speed: p0.speed + (p1.speed - p0.speed) * alpha,
        };
    }, [telemetryData, currentTime]);

    // 2. Formatting the time string
    const formattedTime = useMemo(() => {
        const minutes = Math.floor(currentTime / 60);
        const seconds = (currentTime % 60).toFixed(2);
        return `${minutes}:${seconds.padStart(5, '0')}`;
    }, [currentTime]);

    const bounds = useMemo(() => {
        if (telemetryData.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        const xs = telemetryData.map(p => p.x);
        const ys = telemetryData.map(p => p.y);
        return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    }, [telemetryData]);

    const linePath = useMemo(() => {
        return telemetryData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    }, [telemetryData]);

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const padding = Math.max(width, height) * 0.1;

    return (
        <div>
            <div className="relative w-full h-125">
                <svg
                    viewBox={`${bounds.minX - padding} ${bounds.minY - padding} ${width + padding * 2} ${height + padding * 2}`}
                    className="w-full h-full"
                    style={{ transform: 'scaleY(-1)' }}
                >
                    <path d={linePath} fill="none" stroke="#ff0000" strokeWidth={width * 0.005} />

                    <circle 
                        cx={carPos.x} 
                        cy={carPos.y} 
                        r={width * 0.012} 
                        fill="white"
                        className="drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    />
                </svg>
            </div>

            <div className="flex gap-10 mt-4">
                <p className="text-gray-light text-xs uppercase tracking-widest">
                    Speed: <span className="text-white font-bold font-sans tabular-nums">{Math.round(carPos.speed)} KM/H</span>
                </p>
                <p className="text-gray-light text-xs uppercase tracking-widest">
                    Time: <span className="text-white font-bold font-sans tabular-nums">{formattedTime}</span>
                </p>
            </div>
        </div>
    );
}
        