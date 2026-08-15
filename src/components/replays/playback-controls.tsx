import { Play, Pause } from 'lucide-react';

const SPEED_OPTIONS = [1, 2, 5, 10, 30];

function formatClock(seconds: number): string {
    const s = Math.max(0, seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

interface PlaybackControlsProps {
    playing: boolean;
    speed: number;
    time: number;
    maxTime: number;
    togglePlay: () => void;
    setSpeed: (n: number) => void;
    seek: (t: number) => void;
    currentLap: number;
    totalLaps: number;
}

export default function PlaybackControls({
    playing,
    speed,
    time,
    maxTime,
    togglePlay,
    setSpeed,
    seek,
    currentLap,
    totalLaps,
}: PlaybackControlsProps) {
    const progressPct = maxTime > 0 ? (time / maxTime) * 100 : 0;

    return (
        <div className="mb-2 p-3 bg-zinc-900 border border-gray-primary rounded-2xl shrink-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
                <button
                    onClick={togglePlay}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors"
                    aria-label={playing ? 'Pause' : 'Play'}
                >
                    {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <div className="flex gap-1">
                    {SPEED_OPTIONS.map(s => (
                        <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            className={`px-2 py-0.5 rounded-md font-mono cursor-pointer transition-colors ${
                                speed === s
                                    ? 'bg-primary text-white'
                                    : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                            }`}
                        >
                            {s}x
                        </button>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-3 text-gray-light font-mono">
                    {playing ? (
                        <div className="flex items-center gap-1 text-primary mr-10">
                            <div className="w-2.5 h-2.5 mb-0.5 rounded-full bg-primary animate-pulse" /> 
                            <p>REPLAYING</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-gray-500 mr-10">
                            <div className="w-2.5 h-2.5 mb-0.5 rounded-full bg-gray-500" /> 
                            <p>PAUSED</p>
                        </div>
                    )}
                    <span>
                        LAP <span className="text-white">{currentLap}</span>/{totalLaps || '-'}
                    </span>
                    <span>
                        <span className="text-white">{formatClock(time)}</span>
                        {' / '}{formatClock(maxTime)}
                    </span>
                </div>
            </div>

            <div className="relative h-1.5">
                <div className="absolute inset-0 rounded-full bg-zinc-800" />
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    style={{ width: `${progressPct}%` }}
                />
                <input
                    type="range"
                    min={0}
                    max={maxTime || 1}
                    step={0.1}
                    value={time}
                    onChange={e => seek(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Seek"
                />
            </div>
        </div>
    );
}
