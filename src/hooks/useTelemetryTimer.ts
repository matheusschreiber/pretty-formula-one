import { useState, useEffect, useRef } from 'react';

export function useTelemetryTimer(maxSeconds: number) {
    const [elapsed, setElapsed] = useState(0);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    const animate = (time: number) => {
        if (!startTimeRef.current) startTimeRef.current = time;
        let currentElapsed = (time - startTimeRef.current) / 1000;

        if (currentElapsed > maxSeconds) {
            startTimeRef.current = time; // Loop
            currentElapsed = 0;
        }

        setElapsed(currentElapsed);
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        if (maxSeconds > 0) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [maxSeconds]);

    return elapsed;
}