import { useEffect, useMemo, useRef, useState } from "react";
import { useReplayPlayback } from "../../hooks/useReplayPlayback";
import type { LeaderboardEntry, ReplayRecord } from "./leaderboard";
import type { Driver, Round } from "../../utils/types";
import PlaybackControls from "./playback-controls";
import Leaderboard from "./leaderboard";


interface Props {
    records: ReplayRecord[];
    drivers: Driver[];
    round: Round;
    errorMsg: string;
}

export default function ReplayTable({records, drivers, round, errorMsg}: Props) {
    const maxTime = useMemo(() => {
        return records[records.length - 1]?.time ?? 0;
    }, [records]);

    const { time, playing, speed,
        setSpeed, togglePlay, seek } = useReplayPlayback(maxTime);

    // the leaderboard waits some seconds after the position changes
    // before actually updating the displayed order, to avoid flickering 
    // when drivers are close together
    const POSITION_HOLD_SECONDS = 1.5;

    const positionsKey = useMemo(() => {
        const MARGIN = 0.1; // TODO: this is weirdly specific
        return records
            .filter(r => Math.abs(r.time - time) <= MARGIN)
            .map(r => `${r.driver}:${r.position}`)
            .join('|');
    }, [records, time]);

    const baseStates: LeaderboardEntry[] = useMemo(() => {
        const MARGIN = 0.5; // TODO: this is weirdly specific
        const recordsWindow = records.filter(r => Math.abs(r.time - time) <= MARGIN);
        return drivers.map(driver => ({
            driverId: driver.id,
            record: recordsWindow.find(r => r.driver === driver.id) || ({} as ReplayRecord)
        }));
    }, [time, records, drivers]);

    const [displayedOrder, setDisplayedOrder] = useState<string[]>([]);
    const pendingSwapsRef = useRef<Map<string, number>>(new Map());
    const lastTimeRef = useRef<number>(-1);

    useEffect(() => {
        if (baseStates.length === 0) return;

        const actualPos = new Map(
            baseStates.map(s => [s.driverId, s.record.position ?? Number.POSITIVE_INFINITY])
        );

        setDisplayedOrder(prevOrder => {
            const driverSet = new Set(baseStates.map(s => s.driverId));
            const orderValid =
                prevOrder.length === baseStates.length &&
                prevOrder.every(id => driverSet.has(id));

            let order: string[];
            if (!orderValid) {
                order = [...baseStates]
                    .sort((a, b) => (a.record.position ?? 999) - (b.record.position ?? 999))
                    .map(s => s.driverId);
                pendingSwapsRef.current.clear();
            } else {
                order = [...prevOrder];
            }

            if (
                lastTimeRef.current < 0 ||
                time < lastTimeRef.current ||
                time - lastTimeRef.current > 5
            ) {
                pendingSwapsRef.current.clear();
            }
            lastTimeRef.current = time;

            const pending = pendingSwapsRef.current;
            let changed = true;
            let passes = 0;
            while (changed && passes < order.length) {
                changed = false;
                passes++;
                for (let i = 0; i < order.length - 1; i++) {
                    const a = order[i];
                    const b = order[i + 1];
                    const posA = actualPos.get(a) ?? Number.POSITIVE_INFINITY;
                    const posB = actualPos.get(b) ?? Number.POSITIVE_INFINITY;
                    const key = `${a}|${b}`;
                    if (posA > posB) {
                        const since = pending.get(key);
                        if (since === undefined) {
                            pending.set(key, time);
                        } else if (time - since >= POSITION_HOLD_SECONDS) {
                            order[i] = b;
                            order[i + 1] = a;
                            pending.delete(key);
                            changed = true;
                        }
                    } else {
                        pending.delete(key);
                    }
                }
            }

            const same =
                order.length === prevOrder.length &&
                order.every((v, i) => v === prevOrder[i]);
            return same ? prevOrder : order;
        });
    }, [positionsKey]);

    const currentStates: LeaderboardEntry[] = useMemo(() => {
        const stateMap = new Map(baseStates.map(s => [s.driverId, s]));
        if (displayedOrder.length === 0) {
            return [...baseStates].sort(
                (a, b) => (a.record.position ?? 999) - (b.record.position ?? 999)
            );
        }
        return displayedOrder
            .map(id => stateMap.get(id))
            .filter((s): s is LeaderboardEntry => Boolean(s));
    }, [displayedOrder, baseStates]);

    const prevPositionsRef = useRef<Map<string, number>>(new Map());
    const highlightTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const [highlights, setHighlights] = useState<Map<string, 'up' | 'down'>>(new Map());

    useEffect(() => {
        if (!playing) {
            currentStates.forEach((s, i) => {
                prevPositionsRef.current.set(s.driverId, i + 1);
            });
            return;
        }
        currentStates.forEach((s, i) => {
            const prev = prevPositionsRef.current.get(s.driverId);
            const cur = i + 1; // displayed rank
            if (prev !== undefined && prev !== cur && !s.record.is_retired) {
                const dir: 'up' | 'down' = cur < prev ? 'up' : 'down';
                setHighlights(prevMap => {
                    const nm = new Map(prevMap);
                    nm.set(s.driverId, dir);
                    return nm;
                });
                const existing = highlightTimeoutsRef.current.get(s.driverId);
                if (existing) clearTimeout(existing);
                const to = setTimeout(() => {
                    setHighlights(prevMap => {
                        const nm = new Map(prevMap);
                        nm.delete(s.driverId);
                        return nm;
                    });
                    highlightTimeoutsRef.current.delete(s.driverId);
                }, 1600);
                highlightTimeoutsRef.current.set(s.driverId, to);
            }
            prevPositionsRef.current.set(s.driverId, cur);
        });
    }, [currentStates, playing]);

    useEffect(() => {
        if (playing) return;
        highlightTimeoutsRef.current.forEach(t => clearTimeout(t));
        highlightTimeoutsRef.current.clear();
        setHighlights(new Map());
    }, [playing]);

    useEffect(() => () => {
        highlightTimeoutsRef.current.forEach(t => clearTimeout(t));
        highlightTimeoutsRef.current.clear();
    }, []);

    const driverInfoMap = useMemo(() => new Map(drivers.map(d => [d.id, d])), [drivers]);

    const currentLap = currentStates[0]?.record.lap_number ?? 1;

    return (
        <>
            {errorMsg && records.length === 0 ? (
                <div className="p-6 bg-zinc-900 border border-gray-primary rounded-2xl text-gray-light">
                    {errorMsg}
                </div>
            ) : (
                <>
                    <PlaybackControls
                        playing={playing}
                        speed={speed}
                        time={time}
                        maxTime={maxTime}
                        togglePlay={togglePlay}
                        setSpeed={setSpeed}
                        seek={seek}
                        currentLap={currentLap}
                        totalLaps={round.totalLaps}
                    />

                    <Leaderboard
                        entries={currentStates}
                        highlights={highlights}
                        driverInfoMap={driverInfoMap}
                    />
                </>
            )}
        </>
    )
}