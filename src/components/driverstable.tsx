
import { useContext } from 'react';
import { Context } from './context-provider';

import chevron_up from "../assets/icons/chevron_up.svg"
import chevron_down from "../assets/icons/chevron_down.svg"

export default function DriversTable() {

    const { drivers, round } = useContext(Context)!;

    if (!round || drivers.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <div className="bg-main-dark w-100 border border-gray-primary rounded-3xl">
                <div className="flex pt-10 flex-col items-center justify-center gap-2 mb-4">
                    <p className="text-4xl text-gray-light">
                        ROUND
                    </p>
                    {round && (<p className="text-6xl">{round.index}/{round.totalRounds}</p>)}
                </div>


                <table className="w-full border-separate border-spacing-y-2 px-4">
                    <thead>
                        <tr>
                            <th colSpan={2} className='text-left px-2 text-gray-light text-[.6rem]'>ALL TIME</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map((driver, index) => (
                            <tr key={index}>
                                <td className='text-center px-2 h-6'>{(index + 1).toString().padStart(2, '0')}</td>
                                <td className='px-2'>
                                    <img className='w-5 mx-auto' src={driver.teamLogo} alt={driver.team} />
                                </td>
                                <td className='text-center px-2'>{driver.abbreviation}</td>
                                <td className="text-gray-light px-2">
                                    <p className="truncate w-30">{driver.name}</p>
                                </td>
                                <td className="px-2">{driver.points.toFixed(1)}</td>
                                {driver.recentProfit > 0 ? (
                                    <td className="text-[.6rem] text-green-400 text-center px-2">
                                        <div className='flex gap-1'>
                                            <img src={chevron_up} className='w-2' alt="Chevron icon" /> {driver.recentProfit}
                                        </div>
                                    </td>
                                ) : driver.recentProfit < 0 ? (
                                    <td className="text-[.6rem] text-red-400 text-center px-2">
                                        <div className='flex gap-1'>
                                            <img src={chevron_down} className='w-2' alt="Chevron icon" /> {driver.recentProfit}
                                        </div>
                                    </td>
                                ) : (
                                    <td className="text-[.6rem] text-gray-400 text-center px-2">
                                        ----
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}