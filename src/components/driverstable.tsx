import { useContext } from 'react';
import { Context } from './context-provider';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DriversTable() {
    const { drivers, round } = useContext(Context)!;

    if (!round || drivers.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <div className="bg-main-dark w-100 border border-gray-primary rounded-3xl overflow-hidden">
            <div className="flex pt-10 flex-col items-center justify-center gap-2 mb-4">
                <p className="text-4xl text-gray-light">ROUND</p>
                <p className="text-6xl">{round.index}/{round.totalRounds}</p>
            </div>

            <table className="w-full border-separate border-spacing-y-2 px-4 pb-4">
                <thead>
                    <tr>
                        <th colSpan={2} className='text-left px-2 text-gray-light text-[.6rem]'>ALL TIME</th>
                    </tr>
                </thead>
                <motion.tbody layout>
                    <AnimatePresence mode='popLayout'>
                        {drivers.map((driver, index) => (
                            <motion.tr 
                                layout
                                key={driver.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 40,
                                    opacity: { duration: 0.2 }
                                }}
                            >
                                <td className='text-center px-2 h-6'>
                                    {(index + 1).toString().padStart(2, '0')}
                                </td>
                                <td className='px-2'>
                                    <img className='w-5 mx-auto' src={driver.teamLogo} alt={driver.team} />
                                </td>
                                <td className='text-center px-2 font-bold'>{driver.abbreviation}</td>
                                <td className="text-gray-light px-2">
                                    <p className="truncate w-30">{driver.name}</p>
                                </td>
                                <td className="px-2 font-bold">
                                    {driver.points.toFixed(1)}
                                </td>
                                
                                <td className="text-[.6rem] text-center px-2">
                                    {driver.recentProfit > 0 ? (
                                        <div className='flex items-center text-green-400'>
                                            <ChevronUp className='w-4'/> {driver.recentProfit}
                                        </div>
                                    ) : driver.recentProfit < 0 ? (
                                        <div className='flex items-center text-red-400'>
                                            <ChevronDown className='w-4'/> {Math.abs(driver.recentProfit)}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">----</span>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </motion.tbody>
            </table>
        </div>
    );
}