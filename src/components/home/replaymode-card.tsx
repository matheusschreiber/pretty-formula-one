import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Play, Timer } from "lucide-react";
import type { Round } from "../../utils/types";

const TICKS = 40;
const SCRUB_DURATION = 1.4;

const playVariants: Variants = {
    idle: { scale: 1, opacity: 0.8 },
    hover: {
        scale: [1, 1.15, 1],
        opacity: 1,
        transition: {
            scale: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.2 }
        }
    }
};

const filledBarVariants: Variants = {
    idle: { scaleX: 0 },
    hover: {
        scaleX: 1,
        transition: { duration: SCRUB_DURATION, ease: [0.4, 0, 0.2, 1] }
    }
};

const scrubberVariants: Variants = {
    idle: { left: "0%", opacity: 0 },
    hover: {
        left: "100%",
        opacity: 1,
        transition: {
            left: { duration: SCRUB_DURATION, ease: [0.4, 0, 0.2, 1] },
            opacity: { duration: 0.15 }
        }
    }
};

const timelineRevealVariants: Variants = {
    hidden: { opacity: 0, filter: "blur(4px)" },
    show: {
        opacity: 1,
        filter: "blur(0px)",
        transition: { type: "spring", stiffness: 160, damping: 20, delay: 0.05 }
    },
    exit: {
        opacity: 0,
        filter: "blur(4px)",
        transition: { duration: 0.15 }
    }
};

const backgroundGlowVariants: Variants = {
    idle: { opacity: 0 },
    hover: {
        opacity: 1,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

const playButtonVariants: Variants = {
    idle: {
        backgroundColor: "rgba(239, 68, 68, 0)",
        boxShadow: "0 0 0px rgba(239, 68, 68, 0)"
    },
    hover: {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        boxShadow: "0 0 20px rgba(239, 68, 68, 0.35)",
        transition: { duration: 0.35, ease: "easeOut" }
    }
};

const sectorContainerVariants: Variants = {
    idle: {},
    hover: {
        transition: { staggerChildren: 0.08, delayChildren: 0.15 }
    }
};

const sectorVariants: Variants = {
    idle: { opacity: 0, y: 24 },
    hover: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 220, damping: 22 }
    }
};

function formatStopwatch(ms: number): string {
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    const millis = Math.floor((ms % 1000));
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
}

interface Props {
    year: number;
    round: Round;
}

export default function ReplayModeCard({ year, round }: Props) {
    const [hovered, setHovered] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const start = performance.now();
        let raf = 0;
        const tick = () => {
            setElapsed(performance.now() - start);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    if (!year || !round || !round.index) {
        return <></>;
    }

    return (
        <Link
            to={"/replay?year=" + year.toString() + "&round=" + round.index.toString()}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <motion.div
                initial="idle"
                animate={hovered ? "hover" : "idle"}
                className="relative lg:w-125 lg:mb-0 lg:mx-0 mx-5 border 
                    border-gray-primary overflow-hidden rounded-4xl 
                    bg-no-repeat bg-cover bg-center 
                    bg-linear-[120deg] from-zinc-930 from-25%  to-zinc-950 to-25%
                    hover:border-primary transition-colors cursor-pointer"
            >
                <motion.div
                    variants={backgroundGlowVariants}
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(circle at 15% 85%, rgba(239, 68, 68, 0.22) 0%, rgba(239, 68, 68, 0.08) 35%, transparent 70%)"
                    }}
                />

                <p className="relative text-3xl my-5 font-bold text-white text-center uppercase">
                    Replay <span className="text-primary">MODE</span>
                </p>

                <div className="relative inset-x-0 bottom-4 px-8 mb-10 flex items-center gap-4">
                    <motion.div
                        variants={playButtonVariants}
                        className="shrink-0 w-11 h-11 rounded-full border border-primary flex items-center justify-center"
                    >
                        <motion.div
                            variants={playVariants}
                            initial="idle"
                            animate={hovered ? "hover" : "idle"}
                            className="flex items-center justify-center"
                        >
                            <Play className="w-4 h-4 text-primary" fill="currentColor" />
                        </motion.div>
                    </motion.div>

                    <AnimatePresence initial={false}>
                        {hovered && (
                            <motion.div
                                key="timeline"
                                variants={timelineRevealVariants}
                                initial="hidden"
                                animate="show"
                                exit="exit"
                                className="flex-1 relative h-8 flex items-center"
                            >
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-primary rounded-full" />

                                <motion.div
                                    variants={filledBarVariants}
                                    initial="idle"
                                    animate="hover"
                                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary rounded-full origin-left"
                                />

                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between">
                                    {Array.from({ length: TICKS }).map((_, i) => (
                                        <span
                                            key={i}
                                            className={`w-px bg-gray-primary ${i % 5 === 0 ? "h-3" : "h-1.5"}`}
                                        />
                                    ))}
                                </div>

                                <motion.div
                                    variants={scrubberVariants}
                                    initial="idle"
                                    animate="hover"
                                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-6 rounded-full bg-primary shadow-[0_0_12px_rgba(239,68,68,0.7)]"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <motion.div
                    variants={sectorContainerVariants}
                    className="absolute bottom-3 right-6 text-xl flex gap-3 font-mono tabular-nums font-bold"
                >
                    <motion.p variants={sectorVariants}
                        className="text-blue-500">
                        S1
                    </motion.p>
                    <motion.p variants={sectorVariants}
                        className="text-red-500">
                        S2
                    </motion.p>
                    <motion.p variants={sectorVariants}
                        className="text-yellow-500">
                        S3
                    </motion.p>
                </motion.div>

                <motion.div className="absolute bottom-3 left-6 flex items-center gap-2 text-gray-light font-mono tabular-nums"
                    variants={sectorVariants}>
                    <Timer className="w-4 h-4" />
                    <span>{formatStopwatch(elapsed)}</span>
                </motion.div>

            </motion.div>
        </Link>
    );
}