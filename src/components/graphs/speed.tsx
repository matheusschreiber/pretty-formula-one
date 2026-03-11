import { useMemo } from 'react';
import type { TelemetryPoint } from '../../pages/Graphs';

interface TelemetryGraphProps {
    telemetryData: TelemetryPoint[];
    currentTime: number;
}

export default function SpeedGraph({ telemetryData, currentTime }: TelemetryGraphProps) {
    const INTERNAL_WIDTH = 800;
    const INTERNAL_HEIGHT = 200;

    const maxTime = useMemo(() => (telemetryData.length > 0 ? telemetryData[telemetryData.length - 1].seconds : 0), [telemetryData]);
    const maxSpeed = useMemo(() => (telemetryData.length > 0 ? Math.max(...telemetryData.map(p => p.speed)) : 0), [telemetryData]);
    // const maxDistance = useMemo(() => (telemetryData.length > 0 ? telemetryData[telemetryData.length - 1].distance : 0), [telemetryData]);

    const getX = (s: number) => (s / maxTime) * INTERNAL_WIDTH;
    const getY = (v: number) => INTERNAL_HEIGHT - (v / maxSpeed) * INTERNAL_HEIGHT;

    const yTicks = useMemo(() => {
        const steps = 4;
        return Array.from({ length: steps + 1 }, (_, i) => Math.round((maxSpeed / steps) * i));
    }, [maxSpeed]);

    // const xTicks = useMemo(() => {
    //     const steps = 5;
    //     return Array.from({ length: steps + 1 }, (_, i) => ({
    //         distance: Math.round((maxDistance / steps) * i),
    //         time: (maxTime / steps) * i
    //     }));
    // }, [maxDistance, maxTime]);

    const speedPath = useMemo(() => {
        return telemetryData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.seconds)} ${getY(p.speed)}`).join(' ');
    }, [telemetryData, maxSpeed, maxTime]);

    const currentData = useMemo(() => {
        return telemetryData.reduce((acc, p) => p.seconds <= currentTime ? p : acc, telemetryData[0]);
    }, [telemetryData, currentTime]);

    const drsPath = useMemo(() => {
        const DRSTranslation: { [key: string]: boolean } = {
            "0": false, "1": false, "2": false, "3": false,
            "8": false, "10": true, "12": true, "14": true,
        };
        return telemetryData.map((p, i) => {
            let isDrsActivated = DRSTranslation[p.drs.toString()] || false;
            return `${i === 0 ? 'M' : 'L'} ${getX(p.seconds)} ${getY(isDrsActivated ? maxSpeed : 0)}`;
        }).join(' ');
    }, [telemetryData, maxSpeed, maxTime]);

    if (!telemetryData || telemetryData.length === 0) return null;

    return (
        <div className="p-10 rounded-3xl border border-gray-primary w-175 overflow-hidden h-fit">
            <div className="flex justify-between mb-8 text-[0.6rem] uppercase tracking-widest text-gray-light">
                <span className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-yellow-500 rounded-full" /> Speed (km/h)
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-red-600 rounded-full" /> DRS (on/off)
                </span>
            </div>

            <div className="relative">
                <svg 
                    viewBox={`0 0 ${INTERNAL_WIDTH} ${INTERNAL_HEIGHT}`} 
                    className="w-full h-auto overflow-visible"
                >
                    {yTicks.map(tick => (
                        <g key={`y-${tick}`}>
                            <line 
                                x1="-5" y1={getY(tick)} 
                                x2={INTERNAL_WIDTH} y2={getY(tick)} 
                                stroke="#222" 
                                strokeDasharray={tick === 0 ? "0" : "4"} 
                            />
                            <text 
                                x="-12" y={getY(tick)} 
                                fill="#666" fontSize="10" 
                                textAnchor="end" dominantBaseline="middle" 
                                className="font-mono"
                            >
                                {tick}
                            </text>
                        </g>
                    ))}

                    {/* {xTicks.map(tick => (
                        <g key={`x-${tick.distance}`}>
                            <line 
                                x1={getX(tick.time)} y1={INTERNAL_HEIGHT} 
                                x2={getX(tick.time)} y2={INTERNAL_HEIGHT + 5} 
                                stroke="#444" 
                            />
                            <text 
                                x={getX(tick.time)} y={INTERNAL_HEIGHT + 20} 
                                fill="#666" fontSize="10" 
                                textAnchor="middle" 
                                className="font-mono"
                            >
                                {tick.distance}m
                            </text>
                        </g>
                    ))} */}

                    <path d={speedPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
                    <path d={drsPath} fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6" />

                    <g>
                        <line 
                            x1={getX(currentTime)} y1="0" 
                            x2={getX(currentTime)} y2={INTERNAL_HEIGHT} 
                            stroke="white" strokeWidth="1" 
                            opacity="0.3"
                        />
                        
                        {currentData && (
                            <g transform={`translate(${getX(currentTime)}, ${getY(currentData.speed)})`}>
                                <rect 
                                    x="-40" y="-25" 
                                    width="80" height="18" 
                                    rx="4" fill="#f59e0b" 
                                />
                                <text 
                                    y="-12"
                                    fill="black" 
                                    fontSize="12" 
                                    fontWeight="bold" 
                                    textAnchor="middle" 
                                    className="font-mono"
                                >
                                    {currentData.speed.toFixed(2)}
                                </text>
                                <circle r="3" fill="white" stroke="#f59e0b" strokeWidth="1" />
                            </g>
                        )}
                    </g>
                </svg>
            </div>
        </div>
    );
}