import { motion, AnimatePresence } from "framer-motion";
import { getCircuitTrack } from "../utils/circuits-tracks";
import type { Round } from "../utils/types";

export default function CircuitMap({ round }: { round: Round | undefined }) {
    if (!round) return <></>

    return (
        <div className="flex flex-col justify-center items-center text-center mb-15">
            <div className="relative w-full max-w-2xl h-50 flex items-center justify-center group">
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
            </div>

            <motion.p 
                key={round.nameVerbose}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-bold text-gray-light lg:w-125 text-sm tracking-widest uppercase 
                    flex items-center justify-center"
            >
                {round.nameVerbose}
            </motion.p>
        </div>
    );
}