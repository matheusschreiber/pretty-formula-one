import { useMemo } from "react";
import type { TelemetryData, TelemetryPoint } from "../../pages/Graphs";

interface AltitudeGraphProps {
    telemetryData: TelemetryData;
    currentTime: number;
    windowDuration?: number;
}

export default function AltitudeGraph({
    telemetryData,
    currentTime,
    windowDuration = 10,
}: AltitudeGraphProps) {

    const INTERNAL_WIDTH = 700;
    const INTERNAL_HEIGHT = 200;

    const windowIndex = Math.floor(currentTime / windowDuration);
    const startTime = windowIndex * windowDuration;

    const { minZ, rangeZ } = useMemo(() => {
        const values = [
            ...telemetryData.driver1.map(p => p.z),
            ...telemetryData.driver2.map(p => p.z),
        ];
        if (values.length === 0) return { minZ: 0, rangeZ: 1 };
        const min = Math.min(...values);
        const max = Math.max(...values);
        return { minZ: min, rangeZ: (max - min) * 1.1 || 1 };
    }, [telemetryData]);

    const visibleDriver1 = useMemo(() => {
        return telemetryData.driver1.filter(p => p.seconds >= startTime && p.seconds <= currentTime);
    }, [telemetryData.driver1, startTime, currentTime]);

    const visibleDriver2 = useMemo(() => {
        return telemetryData.driver2.filter(p => p.seconds >= startTime && p.seconds <= currentTime);
    }, [telemetryData.driver2, startTime, currentTime]);

    const getX = (s: number) => ((s - startTime) / windowDuration) * INTERNAL_WIDTH;
    const getY = (v: number) => INTERNAL_HEIGHT - ((v - minZ) / rangeZ) * INTERNAL_HEIGHT;

    const buildPath = (points: TelemetryPoint[]) => {
        if (points.length === 0) return '';
        return points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${getX(p.seconds)} ${getY(p.z)}`
        ).join(' ');
    };

    const altitudePath1 = useMemo(() => buildPath(visibleDriver1), [visibleDriver1, startTime, minZ, rangeZ]);
    const altitudePath2 = useMemo(() => buildPath(visibleDriver2), [visibleDriver2, startTime, minZ, rangeZ]);

    if (
        !telemetryData ||
        (telemetryData.driver1.length === 0 && telemetryData.driver2.length === 0)
    ) return null;

    const last1 = visibleDriver1[visibleDriver1.length - 1];
    const last2 = visibleDriver2[visibleDriver2.length - 1];
    const currentZ = last1?.z ?? last2?.z ?? 0;

    return (
        <div className="p-6 rounded-3xl border border-gray-primary overflow-hidden h-64 w-95">
            <div className="flex justify-between mb-4 text-[0.6rem] uppercase tracking-widest text-gray-light">
                <span className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-blue-500 rounded-full" /> Altitude (Rel)
                </span>
                <span className="text-white font-mono">
                    Alt: {currentZ.toFixed(1)}
                </span>
            </div>

            <div className="flex justify-between mb-2 text-[0.6rem] uppercase tracking-widest text-gray-light">
                <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" /> {telemetryData.driver1Name}
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-dashed border-blue-500 rounded-full" /> {telemetryData.driver2Name}
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
                        d={altitudePath1}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                    <path
                        d={altitudePath2}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        opacity="0.6"
                    />

                    {last1 && (
                        <circle
                            cx={getX(currentTime)}
                            cy={getY(last1.z)}
                            r="3"
                            fill="#3b82f6"
                            className="animate-pulse"
                        />
                    )}
                    {last2 && (
                        <circle
                            cx={getX(currentTime)}
                            cy={getY(last2.z)}
                            r="3"
                            fill="#3b82f6"
                            opacity="0.5"
                            className="animate-pulse"
                        />
                    )}
                </svg>
            </div>
        </div>
    )
}