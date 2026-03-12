import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Props {
    options: any[];
    onSelect: (value: any) => void;
    selectedOption?: any | null;
}

export default function CustomSelect({ onSelect, options, selectedOption }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState({"id": "", "name": "Select an option"});

    useEffect(()=>{
        if (options.length == 0) return;

        if (!selectedOption || !selectedOption.id) {
            setSelected(options[0]);
        } else {
            setSelected(selectedOption)
        }
    }, [selectedOption])

    return (
        <div className="relative w-64 font-sans">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-3 
            hover:bg-zinc-800 transition-colors duration-200
            text-white bg-zinc-900 border border-gray-primary rounded-lg shadow-xl"
            >
                <span className="flex items-center gap-2">
                    {selected?.name}
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown size={18} />
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute z-50 w-full p-2 overflow-hidden bg-zinc-900 border border-gray-primary rounded-lg shadow-2xl"
                    >
                        {options.map((option) => (
                            <motion.li
                                key={option?.id}
                                whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                onClick={() => {
                                    setSelected(option);
                                    setIsOpen(false);
                                    onSelect(option?.id);
                                }}
                                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 cursor-pointer rounded-md"
                            >
                                {option?.name}
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}