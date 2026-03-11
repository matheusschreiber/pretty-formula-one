import { useMemo } from "react";
import type { TelemetryPoint } from "../../pages/Graphs";

interface ElevationGraphProps {
    telemetryData: TelemetryPoint[];
    currentTime: number;
    windowDuration?: number;
}

export default function ElevationGraph({
    telemetryData,
    currentTime,
    windowDuration = 10,
}: ElevationGraphProps) {

    const INTERNAL_WIDTH = 700; 
    const INTERNAL_HEIGHT = 200;

    const windowIndex = Math.floor(currentTime / windowDuration);
    const startTime = windowIndex * windowDuration;

    const { minZ, rangeZ } = useMemo(() => {
        const values = telemetryData.map(p => p.z);
        const min = Math.min(...values);
        const max = Math.max(...values);
        return { minZ: min, rangeZ: (max - min) * 1.1 || 1 };
    }, [telemetryData]);

    const visibleData = useMemo(() => {
        return telemetryData.filter(p => p.seconds >= startTime && p.seconds <= currentTime);
    }, [telemetryData, startTime, currentTime]);

    const getX = (s: number) => ((s - startTime) / windowDuration) * INTERNAL_WIDTH;
    const getY = (v: number) => INTERNAL_HEIGHT - ((v - minZ) / rangeZ) * INTERNAL_HEIGHT;

    const elevationPath = useMemo(() => {
        if (visibleData.length === 0) return '';
        return visibleData.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${getX(p.seconds)} ${getY(p.z)}`
        ).join(' ');
    }, [visibleData, INTERNAL_WIDTH, INTERNAL_HEIGHT, startTime, minZ, rangeZ]);

    if (!telemetryData || telemetryData.length === 0) return null;

    const currentZ = visibleData.length > 0 ? visibleData[visibleData.length - 1].z : 0;

    return (
        <div className="p-6 rounded-3xl border border-gray-primary overflow-hidden h-64 w-135">
            <div className="flex justify-between mb-4 text-[0.6rem] uppercase tracking-widest text-gray-light">
                <span className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-blue-500 rounded-full" /> Elevation (Rel)
                </span>
                <span className="text-white font-mono">
                    Alt: {currentZ.toFixed(1)}
                </span>
            </div>

            <div className="relative">
                <svg viewBox={`0 0 ${INTERNAL_WIDTH} ${INTERNAL_HEIGHT}`} className="w-full h-auto overflow-visible">
                    <line 
                        x1="0" y1={INTERNAL_HEIGHT / 2} 
                        x2={INTERNAL_WIDTH} y2={INTERNAL_HEIGHT / 2} 
                        stroke="#222" strokeDasharray="4" 
                    />

                    <path
                        d={elevationPath}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {visibleData.length > 0 && (
                        <circle
                            cx={getX(currentTime)}
                            cy={getY(currentZ)}
                            r="3"
                            fill="#3b82f6"
                            className="animate-pulse"
                        />
                    )}
                </svg>
            </div>
        </div>
    )
}