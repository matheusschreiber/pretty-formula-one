import { useEffect, useMemo, useState } from "react";
import type { TelemetryPoint } from "../../pages/Graphs";

import hardIcon from "../../assets/tyres/hard.svg";
import mediumIcon from "../../assets/tyres/medium.svg";
import softIcon from "../../assets/tyres/soft.svg";
import interIcon from "../../assets/tyres/intermediate.svg";
import wetIcon from "../../assets/tyres/wet.svg";

interface TyreGraphProps {
    telemetryData: TelemetryPoint[];
}

export default function TyreGraph({ telemetryData }: TyreGraphProps) {

    const [compound, setCompound] = useState<string>("")
    const config = useMemo(() => {
        const typeMap:any = {
            SOFT: { color: '#dc2626', icon: softIcon, label: 'SOFT' },
            MEDIUM: { color: '#facc15', icon: mediumIcon, label: 'MEDIUM' },
            HARD: { color: '#ffffff', icon: hardIcon, label: 'HARD' },
            INTERMEDIATE: { color: '#22c55e', icon: interIcon, label: 'INTER' },
            WET: { color: '#3b82f6', icon: wetIcon, label: 'WET' },
        };
        return typeMap[compound];
    }, [compound]);

    useEffect(()=>{
        setCompound("")
        if (!telemetryData || telemetryData.length == 0) return;
        setCompound(telemetryData[0].compound)
    }, [telemetryData])
    
    if (!config || !compound) return <></>

    return (
        <div className="p-4 rounded-3xl border border-gray-primary flex flex-col items-center justify-center gap-4 w-30 h-64 overflow-hidden">
            <span className="text-[0.6rem] uppercase tracking-widest text-gray-light mb-10">Compound</span>

            <img src={config.icon} alt={config.label} className="w-20 h-20" />
            
            <div className="text-[0.7rem] text-gray-500 font-mono" style={{color: config.color}}>
                {config.label}
            </div>
        </div>
    );
};