import { useMemo } from "react";
import type { TelemetryPoint } from "../../pages/Graphs";

interface RPMGraphProps {
    telemetryData: TelemetryPoint[];
    currentTime: number;
}

export default function RPMGraph({
    telemetryData,
    currentTime,
}: RPMGraphProps) {
    const INTERNAL_WIDTH = 100;
    const INTERNAL_HEIGHT = 200;

    const MAX_RPM = telemetryData.reduce((max, p) => Math.max(max, p.rpm), 0) * 1.1;

    const currentPoint = useMemo(() => {
        return telemetryData.reduce((closest, p) => {
            return Math.abs(p.seconds - currentTime) < Math.abs(closest.seconds - currentTime) ? p : closest;
        }, telemetryData[0]);
    }, [telemetryData, currentTime]);

    const rpm = currentPoint?.rpm || 0;
    
    const percent = Math.min(rpm / MAX_RPM, 1);
    const barHeight = percent * INTERNAL_HEIGHT;

    const getBarColor = (val: number) => {
        if (val > 11000) return "#ef4444";
        if (val > 9000) return "#3b82f6";
        return "#22c55e";
    };

    if (!telemetryData || telemetryData.length === 0) return null;

    return (
        <div className="p-4 rounded-3xl border border-gray-primary flex flex-col items-center gap-4 w-fit h-64 px-10">
            <span className="text-[0.6rem] uppercase tracking-widest text-gray-light">RPM</span>
            
            <div className="relative">
                <svg viewBox={`0 0 ${INTERNAL_WIDTH} ${INTERNAL_HEIGHT}`} width="40" height="150" className="overflow-visible">
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
                        y={-50}
                        fill="white"
                        fontSize={40}
                        fontWeight="bold"
                        className="font-mono"
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {Math.round(rpm)}
                    </text>
                </svg>
            </div>

            <div className="text-[0.7rem] text-gray-500 font-mono">
                {currentPoint?.seconds.toFixed(1)}s
            </div>
        </div>
    );
}