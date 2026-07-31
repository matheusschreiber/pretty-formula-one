import { useEffect, useMemo, useState } from "react";
import type { TelemetryData, TelemetryPoint } from "../../pages/Graphs";

import hardIcon from "../../assets/tyres/hard.svg";
import mediumIcon from "../../assets/tyres/medium.svg";
import softIcon from "../../assets/tyres/soft.svg";
import interIcon from "../../assets/tyres/intermediate.svg";
import wetIcon from "../../assets/tyres/wet.svg";

interface TyreGraphProps {
    telemetryData: TelemetryData;
}

const compoundMap: Record<string, { color: string; icon: string; label: string }> = {
    SOFT: { color: '#dc2626', icon: softIcon, label: 'SOFT' },
    MEDIUM: { color: '#facc15', icon: mediumIcon, label: 'MEDIUM' },
    HARD: { color: '#ffffff', icon: hardIcon, label: 'HARD' },
    INTERMEDIATE: { color: '#22c55e', icon: interIcon, label: 'INTER' },
    WET: { color: '#3b82f6', icon: wetIcon, label: 'WET' },
};

interface TyreDisplayProps {
    points: TelemetryPoint[];
    label: string;
}

function TyreDisplay({ points, label }: TyreDisplayProps) {
    const [compound, setCompound] = useState<string>("");

    useEffect(() => {
        setCompound("");
        if (!points || points.length === 0) return;
        setCompound(points[0].compound);
    }, [points]);

    const config = useMemo(() => compoundMap[compound], [compound]);

    if (!config || !compound) return null;

    return (
        <div className="flex flex-col items-center gap-2">
            <img src={config.icon} alt={config.label} className="w-16 h-16" />
            <div className="text-[0.7rem] font-mono" style={{ color: config.color }}>
                {config.label}
            </div>
            <span className="text-[0.6rem] uppercase tracking-widest text-gray-light">
                {label}
            </span>
        </div>
    );
}

export default function TyreGraph({ telemetryData }: TyreGraphProps) {
    if (
        !telemetryData ||
        (telemetryData.driver1.length === 0 && telemetryData.driver2.length === 0)
    ) return null;

    return (
        <div className="p-4 rounded-3xl border border-gray-primary flex flex-col items-center justify-center gap-4 w-fit h-64 px-8 overflow-hidden">
            <span className="text-[0.6rem] uppercase tracking-widest text-gray-light">Compound</span>

            <div className="flex items-start gap-6">
                <TyreDisplay points={telemetryData.driver1} label={telemetryData.driver1Name} />
                <TyreDisplay points={telemetryData.driver2} label={telemetryData.driver2Name} />
            </div>
        </div>
    );
}