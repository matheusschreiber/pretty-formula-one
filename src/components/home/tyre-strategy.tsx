import { useState, useEffect } from "react";
import type { Round } from "../../utils/types";

export default function TyreStrategyLineChart({ round }: { round: Round }) {
    const [results, setResults] = useState(round.results || []);
    const [maxLaps, setMaxLaps] = useState(1);

    const INTERNAL_WIDTH = 1000;
    const ROW_HEIGHT = 40;
    const LABEL_WIDTH = 70;

    const typeMap: any = {
        SOFT: '#dc2626',
        MEDIUM: '#facc15',
        HARD: '#ffffff',
        INTERMEDIATE: '#22c55e',
        WET: '#3b82f6',
    };

    useEffect(() => {
        if (round.results) {
            setResults(round.results);
            const total = Math.max(
                ...round.results.flatMap(res => 
                    res.tyre_strat ? res.tyre_strat.map(s => s.lapEnd) : []
                ), 57
            );
            setMaxLaps(total);
        }
    }, [round]);

    const getX = (lap: number) => (lap / maxLaps) * INTERNAL_WIDTH;

    return (
        <div className="flex flex-col gap-3 p-8 border border-white/10 rounded-4xl bg-zinc-950 shadow-2xl 
            overflow-hidden h-120">
            <div className="flex items-center justify-between text-[0.6rem] font-black tracking-[0.2em] uppercase mb-5">
                <p className="text-zinc-500">
                    Race Strategy Chart 
                </p>
                <p className="ml-10 text-gray-primary">({round.name})</p>
            </div>

            <div className="flex items-center justify-around text-[0.6rem] font-black tracking-[0.2em] uppercase">
                {["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"].map((type) => (
                    <div key={type} className="flex items-center gap-2">
                        <div style={{ backgroundColor: typeMap[type], width: 12, height: 2, borderRadius: '50%' }}></div>
                        <p>{type}</p>
                    </div>
                ))}
            </div>

            <div className="relative">
                <svg 
                    viewBox={`0 0 ${INTERNAL_WIDTH + LABEL_WIDTH} ${results.length * ROW_HEIGHT + 50}`} 
                    className="w-full h-auto overflow-visible"
                >
                    {[...Array(9)].map((_, i) => {
                        const lap = Math.round((maxLaps / 8) * i);
                        const x = getX(lap) + LABEL_WIDTH;
                        return (
                            <g key={i}>
                                <line x1={x} y1="0" x2={x} y2={results.length * ROW_HEIGHT} stroke="#222" strokeDasharray="4" />
                                <text x={x} y={results.length * ROW_HEIGHT + 40} fill="#555" fontSize="30" textAnchor="middle" className="font-mono">
                                    {lap === 0 ? 'START' : `L${lap}`}
                                </text>
                            </g>
                        );
                    })}

                    {results.map((driverResult, rowIndex) => {
                        const y = rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                        
                        return (
                            <g key={driverResult.driver_id}>
                                <text 
                                    x="0" y={y} 
                                    fill="#999" fontSize="30" fontWeight="bold" 
                                    dominantBaseline="middle" className="italic"
                                >
                                    {driverResult.driver?.abbreviation}
                                </text>

                                <line 
                                    x1={LABEL_WIDTH} y1={y} 
                                    x2={INTERNAL_WIDTH + LABEL_WIDTH} y2={y} 
                                    stroke="#111" strokeWidth="1" 
                                />

                                {driverResult.tyre_strat?.map((stint, index) => {
                                    const xStart = getX(stint.lapStart) + LABEL_WIDTH;
                                    const xEnd = getX(stint.lapEnd) + LABEL_WIDTH;
                                    const color = typeMap[stint.compound] || '#333';

                                    return (
                                        <g key={index} className="group/stint">
                                            <line 
                                                x1={xStart} y1={y} 
                                                x2={xEnd} y2={y} 
                                                stroke={color} 
                                                strokeWidth="4" 
                                                strokeLinecap="round"
                                                className="transition-all cursor-crosshair"
                                            />
                                            
                                            <line x1={xEnd} y1={y - 5} x2={xEnd} y2={y + 5} stroke="#444" strokeWidth="1" />
                                            
                                            <title>{`${stint.compound}: Laps ${stint.lapStart}-${stint.lapEnd}`}</title>
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}