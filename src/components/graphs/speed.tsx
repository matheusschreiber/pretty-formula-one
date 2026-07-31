import { useMemo } from 'react';
import type { TelemetryData, TelemetryPoint } from '../../pages/Graphs';

interface TelemetryGraphProps {
    telemetryData: TelemetryData;
    currentTime: number;
}

const DRS_TRANSLATION: { [key: string]: boolean } = {
    "0": false, "1": false, "2": false, "3": false,
    "8": false, "10": true, "12": true, "14": true,
};

export default function SpeedGraph({ telemetryData, currentTime }: TelemetryGraphProps) {
    const INTERNAL_WIDTH = 800;
    const INTERNAL_HEIGHT = 200;

    const maxTime = useMemo(() => {
        const end1 = telemetryData.driver1.length > 0 ? telemetryData.driver1[telemetryData.driver1.length - 1].seconds : 0;
        const end2 = telemetryData.driver2.length > 0 ? telemetryData.driver2[telemetryData.driver2.length - 1].seconds : 0;
        return Math.max(end1, end2);
    }, [telemetryData]);

    const maxSpeed = useMemo(() => {
        const speeds = [
            ...telemetryData.driver1.map(p => p.speed),
            ...telemetryData.driver2.map(p => p.speed),
        ];
        return speeds.length > 0 ? Math.max(...speeds) : 0;
    }, [telemetryData]);

    const getX = (s: number) => (maxTime > 0 ? (s / maxTime) * INTERNAL_WIDTH : 0);
    const getY = (v: number) => INTERNAL_HEIGHT - (maxSpeed > 0 ? (v / maxSpeed) * INTERNAL_HEIGHT : 0);

    const yTicks = useMemo(() => {
        const steps = 4;
        return Array.from({ length: steps + 1 }, (_, i) => Math.round((maxSpeed / steps) * i));
    }, [maxSpeed]);

    const buildSpeedPath = (points: TelemetryPoint[]) => {
        if (points.length === 0) return '';
        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.seconds)} ${getY(p.speed)}`).join(' ');
    };

    const buildDrsPath = (points: TelemetryPoint[]) => {
        if (points.length === 0) return '';
        return points.map((p, i) => {
            const isDrsActivated = DRS_TRANSLATION[p.drs.toString()] || false;
            return `${i === 0 ? 'M' : 'L'} ${getX(p.seconds)} ${getY(isDrsActivated ? maxSpeed : 0)}`;
        }).join(' ');
    };

    const speedPath1 = useMemo(() => buildSpeedPath(telemetryData.driver1), [telemetryData.driver1, maxSpeed, maxTime]);
    const speedPath2 = useMemo(() => buildSpeedPath(telemetryData.driver2), [telemetryData.driver2, maxSpeed, maxTime]);
    const drsPath1 = useMemo(() => buildDrsPath(telemetryData.driver1), [telemetryData.driver1, maxSpeed, maxTime]);
    const drsPath2 = useMemo(() => buildDrsPath(telemetryData.driver2), [telemetryData.driver2, maxSpeed, maxTime]);

    const getCurrent = (points: TelemetryPoint[]) => {
        if (points.length === 0) return undefined;
        return points.reduce((acc, p) => p.seconds <= currentTime ? p : acc, points[0]);
    };

    const currentData1 = useMemo(() => getCurrent(telemetryData.driver1), [telemetryData.driver1, currentTime]);
    const currentData2 = useMemo(() => getCurrent(telemetryData.driver2), [telemetryData.driver2, currentTime]);

    if (
        !telemetryData ||
        (telemetryData.driver1.length === 0 && telemetryData.driver2.length === 0)
    ) return null;

    return (
        <div className="p-10 rounded-3xl border border-gray-primary overflow-hidden h-64">
            <div className="mb-4 text-[0.6rem] uppercase tracking-widest text-gray-light">
                <span className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-1 bg-yellow-500 rounded-full" /> Speed (km/h)
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-1 bg-red-600 rounded-full" /> DRS (on/off)
                    </span>
                </span>
                <span className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" /> {telemetryData.driver1Name}
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-3 h-3 border border-dashed border-yellow-500 rounded-full" /> {telemetryData.driver2Name}
                    </span>
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

                    <path d={speedPath1} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
                    <path d={drsPath1} fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6" />

                    <path
                        d={speedPath2}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                        strokeLinejoin="round"
                        opacity="0.6"
                    />
                    <path
                        d={drsPath2}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                        strokeLinejoin="round"
                        opacity="0.4"
                    />

                    <g>
                        <line
                            x1={getX(currentTime)} y1="0"
                            x2={getX(currentTime)} y2={INTERNAL_HEIGHT}
                            stroke="white" strokeWidth="1"
                            opacity="0.3"
                        />

                        {currentData1 && (
                            <g transform={`translate(${getX(currentTime)}, ${getY(currentData1.speed)})`}>
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
                                    {currentData1.speed.toFixed(2)}
                                </text>
                                <circle r="3" fill="white" stroke="#f59e0b" strokeWidth="1" />
                            </g>
                        )}

                        {currentData2 && (
                            <g transform={`translate(${getX(currentTime)}, ${getY(currentData2.speed)})`}>
                                <rect
                                    x="-40" y="8"
                                    width="80" height="18"
                                    rx="4" fill="#f59e0b"
                                    opacity="0.6"
                                />
                                <text
                                    y="21"
                                    fill="black"
                                    fontSize="12"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    className="font-mono"
                                >
                                    {currentData2.speed.toFixed(2)}
                                </text>
                                <circle r="3" fill="gray" stroke="#f59e0b" strokeWidth="1" />
                            </g>
                        )}
                    </g>
                </svg>
            </div>
        </div>
    );
}