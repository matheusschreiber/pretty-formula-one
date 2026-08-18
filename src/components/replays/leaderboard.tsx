import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

import type { Driver } from '../../utils/types';
import { TEAM_COLORS } from '../../utils/teams-colors';

import placeholderTeamLogo from '../../assets/icons/placeholder.png';
import hardIcon from '../../assets/tyres/hard.svg';
import mediumIcon from '../../assets/tyres/medium.svg';
import softIcon from '../../assets/tyres/soft.svg';
import interIcon from '../../assets/tyres/intermediate.svg';
import wetIcon from '../../assets/tyres/wet.svg';

export interface ReplayRecord {
    driver: string;
    lap_number: number;
    x: number; y: number; z: number;
    time: number;
    position: number;
    compound: string;
    tyre_life: number;
    gap_to_leader: number;
    gap_to_front: number;
    speed: number;
    current_best_lap_time: number;
    last_lap_time: number;
    current_sector1_time: number;
    current_sector2_time: number;
    current_sector3_time: number;
    best_sector1_time: number;
    best_sector2_time: number;
    best_sector3_time: number;
    is_in_pit: boolean;
    is_retired: boolean;
}

export interface LeaderboardEntry {
    driverId: string;
    record: ReplayRecord;
}

const COMPOUND_ICON: Record<string, string> = {
    SOFT: softIcon, MEDIUM: mediumIcon, HARD: hardIcon,
    INTERMEDIATE: interIcon, WET: wetIcon,
};

function formatLapTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds - m * 60;
    return `${m}:${s.toFixed(3).padStart(6, '0')}`;
}

function formatGap(seconds: number): string {
    if (seconds === undefined || seconds === null || seconds <= 0) return '—';
    return `+${seconds.toFixed(3)}`;
}

function formatSector(seconds: number | undefined): string {
    if (!seconds || seconds <= 0) return '00.000';
    return seconds.toFixed(3);
}

function idToLabel(id: string): string {
    return id.replace(/_20\d\d$/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function idToAbbr(id: string): string {
    const base = id.replace(/_20\d\d$/, '');
    const last = base.split('_').slice(-1)[0];
    return last.slice(0, 3).toUpperCase();
}

interface LeaderboardProps {
    entries: LeaderboardEntry[];
    highlights: Map<string, 'up' | 'down'>;
    driverInfoMap: Map<string, Driver>;
}

function BestSectorCell({ value, isSessionBest }: { value: number; isSessionBest: boolean }) {
    return (
        <div className="relative flex-1 px-1 rounded overflow-hidden">
            <div className="relative z-10 overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                        key={value}
                        initial={{ y: '100%', color: '#22c55e' }} 
                        animate={{  y: 0,  color: ['#22c55e', '#22c55e', '#ffffff'] }}
                        exit={{ y: '-100%', color: 'inherit' }}
                        transition={{
                            y:      {duration: 0.5, ease: 'easeOut' },
                            color:  {duration: 0.8, ease: 'easeInOut'}
                        }}
                        className={isSessionBest ? 'bg-purple-600/70 rounded' : ''}
                    >
                        {formatSector(value)}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function Leaderboard({ entries, highlights, driverInfoMap }: LeaderboardProps) {
    const sessionBest = { s1: Infinity, s2: Infinity, s3: Infinity, lap: Infinity };

    for (const e of entries) {
        const r = e.record;
        if (r.best_sector1_time > 0 && r.best_sector1_time < sessionBest.s1) sessionBest.s1 = r.best_sector1_time;
        if (r.best_sector2_time > 0 && r.best_sector2_time < sessionBest.s2) sessionBest.s2 = r.best_sector2_time;
        if (r.best_sector3_time > 0 && r.best_sector3_time < sessionBest.s3) sessionBest.s3 = r.best_sector3_time;
        if (r.current_best_lap_time > 0 && r.current_best_lap_time < sessionBest.lap) sessionBest.lap = r.current_best_lap_time;
        
    }

    const lapClass = (current: number, overallBest: number): string => {
        if (!current || current <= 0) return '';
        if (current === overallBest) return 'bg-purple-600/70 text-white rounded';
        return '';
    }

    return (
        <LayoutGroup>
            <div className="flex-1 min-h-0 flex flex-col gap-1">
                <div
                    className="flex items-center text-center gap-2 md:gap-3 px-2 py-1.5 rounded-lg border border-gray-primary bg-zinc-900/40 text-[0.6rem] md:text-[0.65rem] font-mono uppercase tracking-wider text-gray-light shrink-0"
                >
                    <div className="w-1" />
                    <div className="w-6">Pos</div>
                    <div className="w-16">Driver</div>
                    <div className="w-14">Tyre</div>
                    <div className="w-24">Last Lap</div>
                    <div className="w-18">Gap Leader</div>
                    <div className="w-18">Gap Ahead</div>
                    <div className="w-24">Best Lap</div>
                    <div className="w-52">Sectors</div>
                    <div className="w-52">Best Sectors</div>
                    <div className="w-1" />
                </div>
                <AnimatePresence initial={false}>
                    {entries.map((s, idx) => {
                        const driver = driverInfoMap.get(s.driverId);
                        const teamColor = driver
                            ? (TEAM_COLORS[driver.team] || '#888')
                            : '#888';
                        const highlight = highlights.get(s.driverId);
                        const r = s.record;
                        const compound = (r.compound || '').toUpperCase();

                        return (
                            <motion.div
                                key={s.driverId}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: r.is_retired ? 0.5 : 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    layout: { type: 'spring', stiffness: 500, damping: 40 },
                                    opacity: { duration: 0.25 },
                                }}
                                className="relative flex-1 flex items-center gap-2 md:gap-3 px-2 rounded-lg border border-gray-primary bg-zinc-900/70 overflow-hidden"
                            >
                                {highlight && (
                                    <motion.div
                                        key={`${s.driverId}-flash-${highlight}`}
                                        initial={{ opacity: 0.35 }}
                                        animate={{ opacity: 0 }}
                                        transition={{ duration: 1.4, ease: 'easeOut' }}
                                        className={`absolute inset-0 pointer-events-none ${
                                            highlight === 'up' ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                    />
                                )}

                                <div
                                    className="w-1 h-4 rounded-full shrink-0"
                                    style={{ backgroundColor: teamColor }}
                                />

                                <div className="w-6 h-8 flex items-center justify-center font-mono text-gray-light text-sm font-bold shrink-0">
                                    {(idx + 1).toString().padStart(2, '0')}
                                </div>

                                <div className="w-16 flex items-center gap-2 " title={driver?.name ?? idToLabel(s.driverId)}>
                                        <img
                                            src={driver?.teamLogo || placeholderTeamLogo}
                                            alt={driver?.team ?? ''}
                                            title={driver?.team ?? ''}
                                            className="w-4 md:w-5 shrink-0"
                                        />
                                        <span
                                            className="font-bold text-xs md:text-sm"
                                            style={{ color: teamColor }}
                                        >
                                            {driver?.abbreviation ?? idToAbbr(s.driverId)}
                                        </span>
                                        {highlight === 'up' && (
                                            <ChevronUp className="text-green-400 w-5 h-5" />
                                        )}
                                        {highlight === 'down' && (
                                            <ChevronDown className="text-red-400 w-5 h-5" />
                                        )}
                                </div>

                                <div className="w-14 flex justify-center items-center gap-1">
                                    <span className="font-mono text-white w-6 text-center">
                                        {r.tyre_life}
                                    </span>
                                    {COMPOUND_ICON[compound] && (
                                        <img
                                            src={COMPOUND_ICON[compound]}
                                            alt={compound}
                                            title={compound}
                                            className="w-8 h-8"
                                        />
                                    )}
                                </div>

                                <div className="w-24 font-mono text-center">
                                    {formatLapTime(r.last_lap_time)}
                                </div>

                                <div className="w-18 font-mono text-center text-gray-light">
                                    {idx === 0 ? (
                                        <span className="text-yellow-300">LEADER</span>
                                    ) : (
                                        r.is_in_pit ? '--' : formatGap(r.gap_to_leader)
                                    )}
                                </div>

                                <div className="w-18 font-mono text-center text-gray-light">
                                    {idx === 0 ? (
                                        <span className="text-yellow-300">INTERVAL</span>
                                    ) : (
                                        r.is_in_pit ? '--' : formatGap(r.gap_to_front)
                                    )}
                                </div>

                                <div className="w-24 font-mono text-center">
                                    <span className={`flex-1 px-1 ${lapClass(r.current_best_lap_time, sessionBest.lap)}`}>{formatLapTime(r.current_best_lap_time)}</span>
                                </div>

                                <div className="w-52 flex items-center gap-1 font-mono text-center">
                                    <span className="flex-1 px-1">{r.is_in_pit ? '--' : formatSector(r.current_sector1_time)}</span>
                                    <span className="flex-1 px-1">{r.is_in_pit ? '--' : formatSector(r.current_sector2_time)}</span>
                                    <span className="flex-1 px-1">{r.is_in_pit ? '--' : formatSector(r.current_sector3_time)}</span>
                                </div>
                                
                                <div className="w-52 flex items-center gap-1 font-mono text-center">
                                    <BestSectorCell value={r.best_sector1_time} isSessionBest={r.best_sector1_time === sessionBest.s1 && r.best_sector1_time > 0} />
                                    <BestSectorCell value={r.best_sector2_time} isSessionBest={r.best_sector2_time === sessionBest.s2 && r.best_sector2_time > 0} />
                                    <BestSectorCell value={r.best_sector3_time} isSessionBest={r.best_sector3_time === sessionBest.s3 && r.best_sector3_time > 0} />
                                </div>

                                <div className="shrink-0">
                                    {r.is_retired ? (
                                        <span className="px-1 text-[0.7rem] py-0.5 bg-red-900/70 text-red-200 rounded">
                                            DNF
                                        </span>
                                    ) : r.is_in_pit ? (
                                        <span className="px-1 text-[0.7rem] py-0.5 bg-yellow-900/70 text-yellow-200 rounded">
                                            PIT
                                        </span>
                                    ) : null}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </LayoutGroup>
    );
}
