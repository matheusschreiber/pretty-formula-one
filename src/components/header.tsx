import { useEffect, useState } from 'react'
import logo from '../assets/logo.svg'

import tagheuerBase from '../assets/clocks/tagheuer/base.png'
import tagheuerHours from '../assets/clocks/tagheuer/hours.png'
import tagheuerMinutes from '../assets/clocks/tagheuer/minutes.png'
import tagheuerSeconds from '../assets/clocks/tagheuer/seconds.png'

import { getTimeToNextRace } from '../utils/data';

export default function Header() {
    const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [weekendName, setWeekendName] = useState("");

    useEffect(() => {
        getTimeToNextRace().then((t) => {
            setTime({ days: t.days, hours: t.hours, minutes: t.minutes, seconds: 0 });
            setWeekendName(t.weekendName.toUpperCase())
        })
        
        const interval = setInterval(() => {
            setTime(prev => ({ ...prev, seconds: (prev.seconds + 1) % 60 }));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const secondsDeg = time.seconds * 6;
    const minutesDeg = time.minutes * 6;
    const hoursDeg = (time.hours % 12) * 30 + (time.minutes / 60) * 30;

    return (
        <header className='flex items-center px-10'>
            <a href="/" className='absolute hover:scale-110 transition-transform duration-200'>
                <img src={logo} className="h-15" alt="Logo" />
            </a>

            <div className='w-full flex justify-center'>
                <div className='flex items-center gap-6 bg-black p-3 px-8 rounded-2xl border border-gray-primary shadow-2xl mt-8'>

                    <div className='flex flex-col items-center '>
                        <p className='text-[.7rem]'>{weekendName} WEEKEND {new Date().getFullYear()}</p>
                        <div className='flex gap-4 mt-1 pt-1 items-center border-t border-t-gray-light'>
                            <div className='flex flex-col items-center'>
                                <p className='text-xl font-mono'>{time.days.toString().padStart(2, '0')}</p>
                                <p className='text-[0.6rem] text-gray-light'>DAYS</p>
                            </div>
                            <div className='h-10 border border-gray-light'></div>
                            <div className='flex flex-col items-center'>
                                <p className='text-xl font-mono'>{time.hours.toString().padStart(2, '0')}</p>
                                <p className='text-[0.6rem] text-gray-light'>HOURS</p>
                            </div>
                            <div className='h-10 border border-gray-light'></div>
                            <div className='flex flex-col items-center'>
                                <p className='text-xl font-mono'>{time.minutes.toString().padStart(2, '0')}</p>
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