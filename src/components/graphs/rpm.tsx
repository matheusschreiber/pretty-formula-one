import { useMemo } from "react";
import type { TelemetryData, TelemetryPoint } from "../../pages/Graphs";

interface RPMGraphProps {
    telemetryData: TelemetryData;
    currentTime: number;
}

export default function RPMGraph({
    telemetryData,
    currentTime,
}: RPMGraphProps) {
    const INTERNAL_WIDTH = 100;
    const INTERNAL_HEIGHT = 200;

    const MAX_RPM = useMemo(() => {
        const max1 = telemetryData.driver1.reduce((m, p) => Math.max(m, p.rpm), 0);
        const max2 = telemetryData.driver2.reduce((m, p) => Math.max(m, p.rpm), 0);
        return Math.max(max1, max2) * 1.1;
    }, [telemetryData]);

    const getCurrentPoint = (points: TelemetryPoint[]) => {
        if (points.length === 0) return undefined;
        return points.reduce((closest, p) => {
            return Math.abs(p.seconds - currentTime) < Math.abs(closest.seconds - currentTime) ? p : closest;
        }, points[0]);
    };

    const currentPoint1 = useMemo(() => getCurrentPoint(telemetryData.driver1), [telemetryData.driver1, currentTime]);
    const currentPoint2 = useMemo(() => getCurrentPoint(telemetryData.driver2), [telemetryData.driver2, currentTime]);

    const rpm1 = currentPoint1?.rpm || 0;
    const rpm2 = currentPoint2?.rpm || 0;

    const barHeight1 = Math.min(rpm1 / MAX_RPM, 1) * INTERNAL_HEIGHT;
    const barHeight2 = Math.min(rpm2 / MAX_RPM, 1) * INTERNAL_HEIGHT;

    const getBarColor = (val: number) => {
        if (val > 11000) return "#ef4444";
        if (val > 9000) return "#3b82f6";
        return "#22c55e";
    };

    const formatRpm = (val: number) => (
        <>
            {Math.floor(val / 1000)}
            <tspan dx="4">{Math.round(val % 1000).toString().padStart(3, '0')}</tspan>
        </>
    );

    if (
        !telemetryData ||
        (telemetryData.driver1.length === 0 && telemetryData.driver2.length === 0)
    ) return null;

    const renderBar = (rpm: number, barHeight: number, label: string) => (
        <div className="flex flex-col items-center gap-2">
            <svg
                viewBox={`0 0 ${INTERNAL_WIDTH} ${INTERNAL_HEIGHT}`}
                width="40"
                height="150"
                className="overflow-visible"
            >
                <rect
                    x="0" y="0"
                    width={INTERNAL_WIDTH} height={INTERNAL_HEIGHT}
                    fill="#1a1a1a" rx="10"
                />
                <rect
                    x="0" y={INTERNAL_HEIGHT - barHeight}
                    width={INTERNAL_WIDTH} height={barHeight}
                    fill={getBarColor(rpm)}
                    rx="10"
                    className="transition-all duration-75 ease-out"
                />
                <text
                    x={INTERNAL_WIDTH / 2}
                    y={-40}
                    fill="white"
                    fontSize={28}
                    fontWeight="bold"
                    className="font-mono"
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    {formatRpm(rpm)}
                </text>
            </svg>
            <span className="text-[0.6rem] uppercase tracking-widest text-gray-light">
                {label}
            </span>
        </div>
    );

    return (
        <div className="p-4 rounded-3xl border border-gray-primary flex flex-col items-center gap-4 w-fit h-64 px-10">
            <span className="text-[0.6rem] uppercase tracking-widest text-gray-light">RPM</span>

            <div className="flex items-start gap-8">
                {renderBar(rpm1, barHeight1, telemetryData.driver1Name)}
                {renderBar(rpm2, barHeight2, telemetryData.driver2Name)}
            </div>

            <div className="text-[0.7rem] text-gray-500 font-mono">
                {(currentPoint1?.seconds ?? currentPoint2?.seconds ?? 0).toFixed(1)}s
            </div>
        </div>
    );
}