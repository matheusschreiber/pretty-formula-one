import { useMemo } from 'react';
import type { TelemetryData, TelemetryPoint } from '../../pages/Graphs';

interface TelemetryGraphProps {
    telemetryData: TelemetryData;
    currentTime: number;
    windowDuration?: number;
}

export default function BrakeThrottleGraph({
    telemetryData,
    currentTime,
    windowDuration = 10
}: TelemetryGraphProps) {

    const INTERNAL_WIDTH = 800;
    const INTERNAL_HEIGHT = 200;

    const windowIndex = Math.floor(currentTime / windowDuration);
    const startTime = windowIndex * windowDuration;

    const getX = (s: number) => ((s - startTime) / windowDuration) * INTERNAL_WIDTH;
    const getY = (v: number) => INTERNAL_HEIGHT - (v / 100) * INTERNAL_HEIGHT;

    const visibleDriver1 = useMemo(() => {
        return telemetryData.driver1.filter(p => p.seconds >= startTime && p.seconds <= currentTime);
    }, [telemetryData.driver1, startTime, currentTime]);

    const visibleDriver2 = useMemo(() => {
        return telemetryData.driver2.filter(p => p.seconds >= startTime && p.seconds <= currentTime);
    }, [telemetryData.driver2, startTime, currentTime]);

    const buildThrottlePath = (points: TelemetryPoint[]) => {
        if (points.length === 0) return '';
        return points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${getX(p.seconds)} ${getY(p.throttle)}`
        ).join(' ');
    };

    const buildBrakePath = (points: TelemetryPoint[]) => {
        if (points.length === 0) return '';
        return points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${getX(p.seconds)} ${getY(p.brake ? 100 : 0)}`
        ).join(' ');
    };

    const throttlePath1 = useMemo(() => buildThrottlePath(visibleDriver1), [visibleDriver1, startTime]);
    const brakePath1 = useMemo(() => buildBrakePath(visibleDriver1), [visibleDriver1, startTime]);
    const throttlePath2 = useMemo(() => buildThrottlePath(visibleDriver2), [visibleDriver2, startTime]);
    const brakePath2 = useMemo(() => buildBrakePath(visibleDriver2), [visibleDriver2, startTime]);

    if (
        !telemetryData ||
        (telemetryData.driver1.length === 0 && telemetryData.driver2.length === 0)
    ) return null;

    const last1 = visibleDriver1[visibleDriver1.length - 1];
    const last2 = visibleDriver2[visibleDriver2.length - 1];

    return (
        <div className="p-6 rounded-3xl border border-gray-primary overflow-hidden h-64">
            <div className="flex justify-between mb-4 text-[0.6rem] uppercase tracking-widest text-gray-light">
                <span className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-1 bg-green-500 rounded-full" /> Throttle (%)
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-1 bg-red-600 rounded-full" /> Brake (On/Off)
                    </span>
                </span>
                <span className="text-white font-mono">
                    {startTime.toFixed(1)} secs
                </span>
                <span className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" /> {telemetryData.driver1Name}
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-3 border border-dashed border-green-500 rounded-full" /> {telemetryData.driver2Name}
                    </span>
                </span>
            </div>

            <div className="relative">
                <svg viewBox={`0 0 ${INTERNAL_WIDTH} ${INTERNAL_HEIGHT}`} className="w-full h-auto overflow-visible">
                    <line x1="0" y1={getY(50)} x2={INTERNAL_WIDTH} y2={getY(50)} stroke="#222" strokeDasharray="4" />

                    <path
                        d={throttlePath1}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                    <path
                        d={brakePath1}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        opacity="0.8"
                    />

                    <path
                        d={throttlePath2}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        opacity="0.6"
                    />
                    <path
                        d={brakePath2}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        opacity="0.5"
                    />

                    {last1 && (
                        <circle
                            cx={getX(currentTime)}
                            cy={getY(last1.throttle)}
                            r="3"
                            fill="#22c55e"
                            className="animate-pulse"
                        />
                    )}
                    {last2 && (
                        <circle
                            cx={getX(currentTime)}
                            cy={getY(last2.throttle)}
                            r="3"
                            fill="#22c55e"
                            opacity="0.5"
                            className="animate-pulse"
                        />
                    )}
                </svg>
            </div>
        </div>
    );
}