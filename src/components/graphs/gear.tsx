import { useMemo, useState, useEffect } from "react";
import type { TelemetryData, TelemetryPoint } from "../../pages/Graphs";
import { motion, AnimatePresence } from "framer-motion";

interface GearGraphProps {
    telemetryData: TelemetryData;
    currentTime: number;
}

const getGearColor = (val: number) => {
    if (val >= 7) return "#ef4444";
    if (val > 4) return "#3b82f6";
    return "#22c55e";
};

interface GearDisplayProps {
    points: TelemetryPoint[];
    currentTime: number;
    label: string;
}

function GearDisplay({ points, currentTime, label }: GearDisplayProps) {
    const [gearState, setGearState] = useState({ current: 0, previous: 0 });

    const currentPoint = useMemo(() => {
        if (points.length === 0) return undefined;
        return points.reduce((prev, current) => current.seconds <= currentTime ? current : prev, points[0]);
    }, [points, currentTime]);

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

    return (
        <div className="flex flex-col items-center gap-2">
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
                        <span className="text-6xl font-black" style={{ color: getGearColor(gear) }}>
                            {gear === 0 ? 'N' : gear}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>
            <span className="text-[0.6rem] uppercase tracking-widest text-gray-light">
                {label}
            </span>
            <div className="text-[0.65rem] text-gray-500 font-mono">
                {(currentPoint?.seconds ?? 0).toFixed(1)}s
            </div>
        </div>
    );
}

export default function GearGraph({
    telemetryData,
    currentTime,
}: GearGraphProps) {
    if (
        !telemetryData ||
        (telemetryData.driver1.length === 0 && telemetryData.driver2.length === 0)
    ) return null;

    return (
        <div className="p-4 rounded-3xl border border-gray-primary flex flex-col items-center justify-center gap-4 w-fit h-64 px-8 overflow-hidden">
            <span className="text-[0.6rem] uppercase tracking-widest text-gray-light">Gear</span>

            <div className="flex items-start gap-6">
                <GearDisplay
                    points={telemetryData.driver1}
                    currentTime={currentTime}
                    label={telemetryData.driver1Name}
                />
                <GearDisplay
                    points={telemetryData.driver2}
                    currentTime={currentTime}
                    label={telemetryData.driver2Name}
                />
            </div>
        </div>
    );
}