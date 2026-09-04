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

    const recordsByDriver = useMemo(() => {
        const map = new Map<string, ReplayRecord[]>();
        for (const r of records) {
            let arr = map.get(r.driver);
            if (!arr) { arr = []; map.set(r.driver, arr); }
            arr.push(r);
        }
        for (const arr of map.values()) arr.sort((a, b) => a.time - b.time);
        return map;
    }, [records]);

    const baseStates: LeaderboardEntry[] = useMemo(() => {
        return drivers.map(driver => {
            const arr = recordsByDriver.get(driver.id);
            let record: ReplayRecord | undefined;
            if (arr && arr.length > 0) {
                let lo = 0, hi = arr.length - 1, ans = -1;
                while (lo <= hi) {
                    const mid = (lo + hi) >> 1;
                    if (arr[mid].time <= time) { ans = mid; lo = mid + 1; }
                    else hi = mid - 1;
                }
                if (ans >= 0) record = arr[ans];
            }
            return {
                driverId: driver.id,
                record: record || ({} as ReplayRecord),
            };
        });
    }, [time, recordsByDriver, drivers]);

    const currentStates: LeaderboardEntry[] = useMemo(
        () => [...baseStates].sort(
            (a, b) => (a.record.position ?? 999) - (b.record.position ?? 999)
        ),
        [baseStates]
    );

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