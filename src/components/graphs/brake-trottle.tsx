import { useMemo } from 'react';
import type { TelemetryPoint } from '../../pages/Graphs';

interface TelemetryGraphProps {
    telemetryData: TelemetryPoint[];
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

    const visibleData = useMemo(() => {
        return telemetryData.filter(p => p.seconds >= startTime && p.seconds <= currentTime);
    }, [telemetryData, startTime, currentTime]);

    const getX = (s: number) => ((s - startTime) / windowDuration) * INTERNAL_WIDTH;
    const getY = (v: number) => INTERNAL_HEIGHT - (v / 100) * INTERNAL_HEIGHT;

    const throttlePath = useMemo(() => {
        if (visibleData.length === 0) return '';
        return visibleData.map((p, i) => 
            `${i === 0 ? 'M' : 'L'} ${getX(p.seconds)} ${getY(p.throttle)}`
        ).join(' ');
    }, [visibleData, INTERNAL_WIDTH, INTERNAL_HEIGHT, startTime]);

    const brakePath = useMemo(() => {
        if (visibleData.length === 0) return '';
        return visibleData.map((p, i) => 
            `${i === 0 ? 'M' : 'L'} ${getX(p.seconds)} ${getY(p.brake ? 100 : 0)}`
        ).join(' ');
    }, [visibleData, INTERNAL_WIDTH, INTERNAL_HEIGHT, startTime]);

    if (!telemetryData || telemetryData.length === 0) return null;

    return (
        <div className="p-6 rounded-3xl border border-gray-primary w-175 overflow-hidden h-64">
            <div className="flex justify-between mb-4 text-[0.6rem] uppercase tracking-widest text-gray-light">
                <span className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-green-500 rounded-full" /> Throttle (%)
                </span>
                <span className="text-white font-mono">
                    {startTime.toFixed(1)}s
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-red-600 rounded-full" /> Brake (On/Off)
                </span>
            </div>

            <div className="relative">
                <svg viewBox={`0 0 ${INTERNAL_WIDTH} ${INTERNAL_HEIGHT}`} className="w-full h-auto overflow-visible">
                    <line x1="0" y1={getY(50)} x2={INTERNAL_WIDTH} y2={getY(50)} stroke="#222" strokeDasharray="4" />
                    
                    <path 
                        d={throttlePath} 
                        fill="none" 
                        stroke="#22c55e" 
                        strokeWidth="2.5" 
                        strokeLinejoin="round" 
                        strokeLinecap="round"
                    />

                    <path 
                        d={brakePath} 
                        fill="none" 
                        stroke="#dc2626" 
                        strokeWidth="2.5" 
                        strokeLinejoin="round" 
                        strokeLinecap="round"
                        opacity="0.8" 
                    />

                    {visibleData.length > 0 && (
                        <circle 
                            cx={getX(currentTime)} 
                            cy={getY(visibleData[visibleData.length - 1].throttle)} 
                            r="3" 
                            fill="#22c55e" 
                            className="animate-pulse"
                        />
                    )}
                </svg>
            </div>
        </div>
    );
}