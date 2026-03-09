import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export const CarouselSelector = ({
    label,
    value,
    min,
    max,
    onPrev,
    onNext,
    displayValue
}: {
    label: string,
    value: number,
    min: number,
    max: number,
    onPrev: () => void,
    onNext: () => void,
    displayValue?: string | number
}) => {
    const [direction, setDirection] = useState(0);

    const variants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 50 : -50,
            opacity: 0,
            filter: "blur(4px)",
        }),
        center: {
            x: 0,
            opacity: 1,
            filter: "blur(0px)",
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -50 : 50,
            opacity: 0,
            filter: "blur(4px)",
        }),
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-gray-light font-bold">
                {label}
            </span>
            <div className="flex items-center gap-4">
                {value - 1 < min ? (
                    <button
                        disabled
                        className="text-gray-light/50 cursor-not-allowed hover:scale-[1.5] active:scale-[.8] transition-all duration-200 p-2"
                    >
                        <ChevronLeft className="w-8" />
                    </button>
                ) : (
                    <button
                        onClick={() => { setDirection(-1); onPrev(); }}
                        className="hover:text-primary cursor-pointer hover:scale-[1.5] active:scale-[.8] transition-all duration-200 p-2"
                    >
                        <ChevronLeft className="w-8" />
                    </button>
                )}
                <div className="w-15 h-10 overflow-hidden relative flex items-center justify-center">
                    <AnimatePresence mode="popLayout" custom={direction}>
                        <motion.span
                            key={displayValue || value}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="text-2xl font-bold font-kdam text-white absolute"
                        >
                            {displayValue || value}
                        </motion.span>
                    </AnimatePresence>
                </div>

                {value + 1 > max ? (
                    <button
                        disabled
                        className="text-gray-light/50 cursor-not-allowed hover:scale-[1.5] active:scale-[.8] transition-all duration-200 p-2"
                    >
                        <ChevronRight className="w-8" />
                    </button>
                ) : (
                    <button
                        onClick={() => { setDirection(1); onNext(); }}
                        disabled={value >= max}
                        className="hover:text-primary cursor-pointer hover:scale-[1.5] active:scale-[.8] transition-all duration-200 p-2"
                    >
                        <ChevronRight className="w-8" />
                    </button>
                )}

            </div>
        </div>
    );
};