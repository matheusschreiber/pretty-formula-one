import { useEffect, useState } from 'react'
import logo from '../assets/logo.svg'

import tagheuerBase from '../assets/clocks/tagheuer/base.png'
import tagheuerHours from '../assets/clocks/tagheuer/hours.png'
import tagheuerMinutes from '../assets/clocks/tagheuer/minutes.png'
import tagheuerSeconds from '../assets/clocks/tagheuer/seconds.png'

import { getTimeToNextRace } from '../utils/data';

export default function Header() {
    const [days, setDays] = useState(0);
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [weekendName, setWeekendName] = useState("");

    useEffect(() => {
        const updateCountdown = () => {
            getTimeToNextRace().then((time) => {
                setDays(time.days)
                setHours(time.hours)
                setMinutes(time.minutes)
                setWeekendName(time.weekendName.toUpperCase())
            })
        };

        updateCountdown();
        
        const interval = setInterval(() => {
            setSeconds(prev => (prev + 1) % 60);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const secondsDeg = seconds * 6;
    const minutesDeg = minutes * 6;
    const hoursDeg = (hours % 12) * 30 + (minutes / 60) * 30;

    return (
        <header className='flex items-center px-10'>
            <a href="/" className='absolute hover:scale-110 transition-transform duration-200'>
                <img src={logo} className="h-15" alt="Logo" />
            </a>

            <div className='w-full flex justify-center'>
                <div className='flex items-center gap-6 bg-black p-3 px-8 rounded-2xl border border-gray-primary shadow-2xl mt-8'>

                    <div className='flex flex-col items-center '>
                        <p className='text-[.7rem]'>{weekendName} WEEKEND</p>
                        <div className='flex gap-4 mt-1 pt-1 items-center border-t border-t-gray-light'>
                            <div className='flex flex-col items-center'>
                                <p className='text-xl font-mono'>{days.toString().padStart(2, '0')}</p>
                                <p className='text-[0.6rem] text-gray-light'>DAYS</p>
                            </div>
                            <div className='h-10 border border-gray-light'></div>
                            <div className='flex flex-col items-center'>
                                <p className='text-xl font-mono'>{hours.toString().padStart(2, '0')}</p>
                                <p className='text-[0.6rem] text-gray-light'>HOURS</p>
                            </div>
                            <div className='h-10 border border-gray-light'></div>
                            <div className='flex flex-col items-center'>
                                <p className='text-xl font-mono'>{minutes.toString().padStart(2, '0')}</p>
                                <p className='text-[0.6rem] text-gray-light'>MINS</p>
                            </div>
                        </div>
                    </div>

                    <div className='relative select-none h-16 w-16 flex items-center justify-center'>
                        <img src={tagheuerBase} alt="Tag Heuer Base" className='h-full w-full object-contain' />
                        
                        <img 
                            src={tagheuerHours} 
                            style={{ transform: `rotate(${hoursDeg}deg)` }}
                            className='absolute h-full transition-transform duration-500 ease-out origin-center' 
                            alt="Hours" 
                        />
                        
                        <img 
                            src={tagheuerMinutes} 
                            style={{ transform: `rotate(${minutesDeg}deg)` }}
                            className='absolute h-full transition-transform duration-500 ease-out origin-center' 
                            alt="Minutes" 
                        />
                        
                        <img 
                            src={tagheuerSeconds} 
                            style={{ transform: `rotate(${secondsDeg}deg)` }}
                            className='absolute h-full transition-transform duration-100 linear origin-center' 
                            alt="Seconds" 
                        />
                    </div>
                </div>
            </div>
        </header>
    )
}