import { useMemo } from 'react';
import type { TelemetryPoint } from '../../pages/Graphs';

interface TelemetryGraphProps {
    telemetryData: TelemetryPoint[];
    currentTime: number;
    width?: number;
    height?: number;
}

export default function BrakeThrottleGraph({ telemetryData, currentTime, width = 800, height = 200 }: TelemetryGraphProps) {
    // 1. Calculate the X and Y scales
    const maxTime = useMemo(() => (telemetryData.length > 0 ? telemetryData[telemetryData.length - 1].seconds : 0), [telemetryData]);
    
    const getX = (s: number) => (s / maxTime) * width;
    const getY = (v: number) => height - (v / 100) * height; // Invert for SVG

    // 2. Generate SVG Paths for Throttle and Brake
    const throttlePath = useMemo(() => {
        return telemetryData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.seconds)} ${getY(p.throttle)}`).join(' ');
    }, [telemetryData, width, height]);

    const brakePath = useMemo(() => {
        // We map 'true' to 100 and 'false' to 0 for the graph
        return telemetryData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.seconds)} ${getY(p.brake ? 100 : 0)}`).join(' ');
    }, [telemetryData, width, height]);

    if (!telemetryData || telemetryData.length === 0) {
        return <></>
    }

    return (
        <div className="p-6 rounded-3xl border border-gray-primary w-175 overflow-hidden h-fit">
            <div className="flex justify-between mb-4 text-[0.6rem] uppercase tracking-widest text-gray-light">
                <span className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-green-500 rounded-full" /> Throttle (%)
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-red-600 rounded-full" /> Brake (On/Off)
                </span>
            </div>

            <div className="relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                    {/* Background Grid Lines */}
                    <line x1="0" y1={getY(50)} x2={width} y2={getY(50)} stroke="#222" strokeDasharray="4" />
                    
                    {/* Throttle Line (Green) */}
                    <path d={throttlePath} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" />

                    {/* Brake Line (Red) */}
                    <path d={brakePath} fill="none" stroke="#dc2626" strokeWidth="2" strokeLinejoin="round" opacity="0.8" />

                    {/* Current Time Indicator (Playhead) */}
                    <line 
                        x1={getX(currentTime)} 
                        y1="0" 
                        x2={getX(currentTime)} 
                        y2={height} 
                        stroke="white" 
                        strokeWidth="2" 
                    />
                </svg>
            </div>
        </div>
    );
}