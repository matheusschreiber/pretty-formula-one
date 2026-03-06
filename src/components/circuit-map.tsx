import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCircuitTrack } from "../utils/circuits-tracks";
import type { Round } from "../utils/types";

interface CircuitMapProps {
    round: Round | undefined;
    onPrev: () => void;
    onNext: () => void;
    canPrev: boolean;
    canNext: boolean;
}

export default function CircuitMap({ round, onPrev, onNext, canPrev, canNext }: CircuitMapProps) {
    if (!round) return <div className="h-62.5 flex items-center">Loading...</div>;

    return (
        <div className="flex flex-col justify-center items-center text-center mb-15">
            <div className="relative w-full max-w-2xl h-62.5 flex items-center justify-center group">
                
                <button 
                    onClick={onPrev}
                    disabled={!canPrev}
                    className={`absolute left-0 z-20 p-4 transition-all duration-200 
                        ${canPrev ? 'text-white hover:text-primary hover:scale-125 cursor-pointer' : 'text-gray-700 cursor-not-allowed opacity-30'}`}
                >
                    <ChevronLeft size={48} strokeWidth={3} />
                </button>

                <div className="relative w-96 h-full flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={round.name}
                            src={getCircuitTrack(round.name)}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.005 } }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]"
                        />
                    </AnimatePresence>
                </div>

                <button 
                    onClick={onNext}
                    disabled={!canNext}
                    className={`absolute right-0 z-20 p-4 transition-all duration-200 
                        ${canNext ? 'text-white hover:text-primary hover:scale-125 cursor-pointer' : 'text-gray-700 cursor-not-allowed opacity-30'}`}
                >
                    <ChevronRight size={48} strokeWidth={3} />
                </button>
            </div>

            <motion.p 
                key={round.nameVerbose}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-bold text-gray-light mt-4 lg:w-125 tracking-widest uppercase"
            >
                {round.nameVerbose}
            </motion.p>
        </div>
    );
}