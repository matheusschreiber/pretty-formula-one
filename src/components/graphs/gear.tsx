import { useMemo, useState, useEffect } from "react";
import type { TelemetryPoint } from "../../pages/Graphs";
import { motion, AnimatePresence } from "framer-motion";

interface GearGraphProps {
    telemetryData: TelemetryPoint[];
    currentTime: number;
}

export default function GearGraph({
    telemetryData,
    currentTime,
}: GearGraphProps) {
    const [gearState, setGearState] = useState({ current: 0, previous: 0 });

    const currentPoint = useMemo(() => {
        return telemetryData.reduce((prev, current) => current.seconds <= currentTime ? current : prev, telemetryData[0]);
    }, [telemetryData, currentTime]);

    const gear = currentPoint?.gear || 0;

    useEffect(() => {
        if (gear !== gearState.current) {
            setGearState(prev => ({
                previous: prev.current,
                current: gear
            }));
        }
    }, [gear, gearState.current]);

    const isUpshift = gearState.current > gearState.previous;

    const getGearColor = (val: number) => {
        if (val >= 7) return "#ef4444";
        if (val > 4) return "#3b82f6";
        return "#22c55e";
    };

    if (!telemetryData || telemetryData.length === 0) return null;

    return (
        <div className="p-4 rounded-3xl border border-gray-primary flex flex-col items-center justify-center gap-4 w-30 h-64 overflow-hidden">
            <span className="text-[0.6rem] uppercase tracking-widest text-gray-light mb-10">Gear</span>
            
            <div className="relative h-24 w-full flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="popLayout" custom={isUpshift}>
                    <motion.div
                        key={gear}
                        initial={{ y: isUpshift ? 40 : -40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: isUpshift ? -40 : 40, opacity: 0 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 300, 
                            damping: 30,
                            opacity: { duration: 0.1 }
                        }}
                        className="absolute"
                    >
                        <span className="text-8xl font-black" style={{ color: getGearColor(gear) }}>
                            {gear === 0 ? 'N' : gear}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="text-[0.7rem] text-gray-500 font-mono">
                {currentPoint?.seconds.toFixed(1)}s
            </div>
        </div>
    );
}