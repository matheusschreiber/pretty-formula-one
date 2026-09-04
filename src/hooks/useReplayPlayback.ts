import { useEffect, useRef, useState } from 'react';

// controlling the react state update rate
const PUBLISH_INTERVAL_MS = 100;

export function useReplayPlayback(maxTime: number) {
    const [time, setTime] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const timeRef = useRef(0);
    const rafRef = useRef<number>(0);
    const lastFrameRef = useRef<number>(0);
    const lastPublishRef = useRef<number>(0);

    useEffect(() => {
        if (!playing || maxTime <= 0) return;

        const step = (t: number) => {
            if (!lastFrameRef.current) {
                lastFrameRef.current = t;
                lastPublishRef.current = t;
            }
            const dt = (t - lastFrameRef.current) / 1000;
            lastFrameRef.current = t;

            const next = Math.max(0, Math.min(maxTime, timeRef.current + dt * speed));
            timeRef.current = next;

            if (next >= maxTime || t - lastPublishRef.current >= PUBLISH_INTERVAL_MS) {
                lastPublishRef.current = t;
                setTime(next);
            }

            rafRef.current = requestAnimationFrame(step);
        };

        lastFrameRef.current = 0;
        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, [playing, speed, maxTime]);

    useEffect(() => {
        if (maxTime > 0 && time >= maxTime && playing) {
            setPlaying(false);
        }
    }, [time, maxTime, playing]);

    const seek = (v: number) => {
        lastFrameRef.current = 0;
        const clamped = Math.max(0, Math.min(maxTime, v));
        timeRef.current = clamped;
        setTime(clamped);
    };

    const togglePlay = () => {
        lastFrameRef.current = 0;
        if (timeRef.current >= maxTime) {
            timeRef.current = 0;
            setTime(0);
            setPlaying(true);
        } else if (playing) {
            setTime(timeRef.current);
            setPlaying(false);
        } else {
            setPlaying(true);
        }
    };

    return { time, playing, speed, setSpeed, togglePlay, seek };
}
