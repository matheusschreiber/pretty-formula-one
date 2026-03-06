import { useEffect, useState } from 'react'

import logo from '../assets/logo.svg'
import tagheuer from '../assets/clocks/tagheuer.png'
import { getTimeToNextRace } from '../utils/data';

export default function Header() {
    const [days, setDays] = useState(0);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);

    useEffect(() => {
        getTimeToNextRace().then((time) => {
            setDays(time.days)
            setHours(time.hours)
            setMinutes(time.minutes)
        })
    })

    return (
        <header className='flex items-center px-10'>
            <img src={logo} className="absolute h-15" alt="Logo" />

            <div className='w-full flex justify-center'>
                <div className='flex items-center gap-6 bg-black p-3 px-8 rounded-2xl border border-gray-primary shadow-2xl mt-8'>

                    <div className='flex flex-col items-center '>
                        <p className='text-[.7rem]'>GRAND PRIX WEEKEND</p>
                        <div className='flex gap-4 mt-1 pt-1 items-center border-t border-t-gray-light'>
                            <div className='flex flex-col items-center'>
                                <p className='text-xl'>{days.toString().padStart(2, '0')}</p>
                                <p className='text-[0.6rem] text-gray-light'>DAYS</p>
                            </div>
                            <div className='h-10 border border-gray-light'></div>
                            <div className='flex flex-col items-center'>
                                <p className='text-xl'>{hours.toString().padStart(2, '0')}</p>
                                <p className='text-[0.6rem] text-gray-light'>HOURS</p>
                            </div>
                            <div className='h-10 border border-gray-light'></div>
                            <div className='flex flex-col items-center'>
                                <p className='text-xl'>{minutes.toString().padStart(2, '0')}</p>
                                <p className='text-[0.6rem] text-gray-light'>MINS</p>
                            </div>
                        </div>
                    </div>
                    <img src={tagheuer} alt="Tag Heuer logo" className='h-15' />
                </div>
            </div>
        </header>
    )
}