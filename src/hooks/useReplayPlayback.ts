import { useEffect, useRef, useState } from 'react';

export function useReplayPlayback(maxTime: number) {
    const [time, setTime] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const rafRef = useRef<number>(0);
    const lastRef = useRef<number>(0);

    useEffect(() => {
        if (!playing || maxTime <= 0) return;

        const step = (t: number) => {
            if (!lastRef.current) lastRef.current = t;
            const dt = (t - lastRef.current) / 1000;
            lastRef.current = t;
            setTime(prev => {
                const next = prev + dt * speed;
                return Math.max(0, Math.min(maxTime, next));
            });
            rafRef.current = requestAnimationFrame(step);
        };

        lastRef.current = 0;
        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, [playing, speed, maxTime]);

    useEffect(() => {
        if (maxTime > 0 && time >= maxTime && playing) {
            setPlaying(false);
        }
    }, [time, maxTime, playing]);

    const seek = (v: number) => {
        lastRef.current = 0;
        setTime(Math.max(0, Math.min(maxTime, v)));
    };

    const togglePlay = () => {
        lastRef.current = 0;
        setPlaying(p => (time >= maxTime ? (setTime(0), true) : !p));
    };

    return { time, playing, speed, setSpeed, togglePlay, seek };
}
