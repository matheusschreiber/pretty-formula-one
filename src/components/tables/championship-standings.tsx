import { useMemo, useRef, useState } from 'react';
import type { DriverStandings, RoundStandings } from '../../utils/championship';
import { TEAM_COLORS } from '../../utils/teams-colors';

interface Props {
    standingsPerRound: RoundStandings[];
    driverStandingsEvolution: DriverStandings[];
}

export default function ChampionshipStandingsGraph({ 
        standingsPerRound, 
        driverStandingsEvolution 
    }: Props) {
        
    const INTERNAL_WIDTH = 900;
    const INTERNAL_HEIGHT = 520;
    const PAD_LEFT = 70;
    const PAD_RIGHT = 70;
    const PAD_TOP = 100;
    const PAD_BOTTOM = 100;

    const maxPoints = useMemo(() => {
        let m = 0;
        for (const s of driverStandingsEvolution) for (const p of s.standings.map(st => st.totalPoints)) if (p > m) m = p;
        return Math.max(m, 10);
    }, [driverStandingsEvolution]);

    const roundCount = standingsPerRound.length;
    const usableW = INTERNAL_WIDTH - PAD_LEFT - PAD_RIGHT;
    const usableH = INTERNAL_HEIGHT - PAD_TOP - PAD_BOTTOM;

    const driverStrokeDashArray: Record<string, string> = useMemo(() => {
        const usedColors = new Set<string>();
        const dashArray: Record<string, string> = {};
        for (const s of driverStandingsEvolution) {
            const color = TEAM_COLORS[s.driver.team] || '#888';
            if (!usedColors.has(color)) {
                usedColors.add(color);
                dashArray[s.driver.id] = '';
            } else {
                dashArray[s.driver.id] = '4 4';
            }
        }
        return dashArray;
    }, [driverStandingsEvolution]);

    const getX = (i: number) =>
        PAD_LEFT + (roundCount <= 1 ? 0 : (i / (roundCount - 1)) * usableW);
    const getY = (p: number) =>
        PAD_TOP + usableH - (p / maxPoints) * usableH;

    const yTicks = useMemo(() => {
        const steps = 5;
        return Array.from({ length: steps + 1 }, (_, i) => Math.round((maxPoints / steps) * i));
    }, [maxPoints]);

    const labelPositions = useMemo(() => {
        const MIN_GAP = 11;
        const sorted = driverStandingsEvolution
            .map(s => ({ id: s.driver.id, y: getY(s.standings[s.standings.length - 1].totalPoints) }))
            .sort((a, b) => a.y - b.y);
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].y - sorted[i - 1].y < MIN_GAP) {
                sorted[i].y = sorted[i - 1].y + MIN_GAP;
            }
        }
        const out: Record<string, number> = {};
        sorted.forEach(s => { out[s.id] = s.y; });
        return out;
    }, [driverStandingsEvolution, maxPoints, roundCount]);

    const buildPath = (points: number[]) =>
        points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p)}`).join(' ');

    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredRound, setHoveredRound] = useState<number | null>(null);

    const pillPositions = useMemo(() => {
        if (hoveredRound === null) return {} as Record<string, number>;
        const rs = standingsPerRound[hoveredRound];
        if (!rs) return {} as Record<string, number>;
        const MIN_GAP = 13;
        const sorted = rs.standings
            .map(s => ({ id: s.driver.id, y: getY(s.points) - 12.5 }))
            .sort((a, b) => a.y - b.y);
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].y - sorted[i - 1].y < MIN_GAP) {
                sorted[i].y = sorted[i - 1].y + MIN_GAP;
            }
        }
        const out: Record<string, number> = {};
        sorted.forEach(s => { out[s.id] = s.y; });
        return out;
    }, [hoveredRound, standingsPerRound, maxPoints, roundCount]);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = svgRef.current;
        if (!svg || roundCount === 0) return;
        const rect = svg.getBoundingClientRect();
        const svgX = ((e.clientX - rect.left) / rect.width) * INTERNAL_WIDTH;
        if (roundCount === 1) { setHoveredRound(0); return; }
        const idx = Math.round(((svgX - PAD_LEFT) / usableW) * (roundCount - 1));
        setHoveredRound(Math.max(0, Math.min(roundCount - 1, idx)));
    };

    if (standingsPerRound.length === 0) return null;

    const finalX = getX(roundCount - 1);

    return (
        <div className="p-10 rounded-3xl border border-gray-primary overflow-hidden">
            <div className="relative">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${INTERNAL_WIDTH} ${INTERNAL_HEIGHT}`}
                    className="w-full h-auto overflow-visible"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredRound(null)}
                >
                    <defs>
                        <filter id="round-glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="1.2" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {yTicks.map(tick => (
                        <g key={`y-${tick}`}>
                            <line
                                x1={PAD_LEFT} y1={getY(tick)}
                                x2={INTERNAL_WIDTH - PAD_RIGHT} y2={getY(tick)}
                                stroke="#222"
                                strokeDasharray={tick === 0 ? "0" : "4"}
                            />
                            {/* <text
                                x={PAD_LEFT - 8} y={getY(tick)}
                                fill="#666" fontSize="10"
                                textAnchor="end" dominantBaseline="middle"
                                className="font-mono"
                            >
                                {tick}
                            </text> */}
                        </g>
                    ))}

                    {standingsPerRound.map((rs, i) => {
                        const isHovered = hoveredRound === i;
                        const axisColor = isHovered ? 'white' : '#666';
                        const axisFilter = isHovered ? 'url(#round-glow)' : undefined;
                        return (
                            <g key={`round-${i}`}>
                                <rect x={getX(i) - 2} y={PAD_TOP - 20} width="1" height="8"
                                    fill={axisColor} filter={axisFilter} />
                                <text
                                    x={getX(i)} y={30}
                                    fill={axisColor} fontSize="9"
                                    textAnchor="middle" dominantBaseline="hanging"
                                    fontWeight={isHovered ? 'bold' : 'normal'}
                                    filter={axisFilter}
                                    className="font-mono uppercase"
                                    transform={`translate(0, ${i % 3 === 0 ? 20 : i % 3 === 1 ? 10 : 0})`}
                                >
                                    {rs.round.name.replace(/ Grand Prix$/, '')}
                                </text>
                                <rect x={getX(i) - 2} y={INTERNAL_HEIGHT - PAD_BOTTOM - 2} width="1" height="8"
                                    fill={axisColor} filter={axisFilter} />
                                {rs.standings.map((standing) => {
                                    const color = TEAM_COLORS[standing.driver.team] || '#888';
                                    const cx = getX(i);
                                    const cy = getY(standing.points);
                                    const pillCenterY = pillPositions[standing.driver.id] ?? (cy - 12.5);
                                    const pillTopY = pillCenterY - 5.5;
                                    const displaced = Math.abs(pillCenterY - (cy - 12.5)) > 0.5;
                                    return (
                                        <g key={`c-${i}-${standing.driver.id}`}>
                                            <circle
                                                cx={cx} cy={cy}
                                                r={isHovered ? 3.5 : 2}
                                                fill={color}
                                                filter={isHovered ? 'url(#round-glow)' : undefined}
                                            />
                                            {isHovered && (
                                                <g>
                                                    {displaced && (
                                                        <line
                                                            x1={cx} y1={cy}
                                                            x2={cx} y2={pillCenterY + 5.5}
                                                            stroke={color}
                                                            strokeWidth="0.5"
                                                            opacity="0.5"
                                                        />
                                                    )}
                                                    <rect
                                                        x={cx - 12} y={pillTopY}
                                                        width="24" height="11" rx="2"
                                                        fill="black"
                                                        stroke={color}
                                                        strokeWidth="0.5"
                                                    />
                                                    <text
                                                        x={cx} y={pillCenterY}
                                                        fill={color}
                                                        fontSize="8"
                                                        fontWeight="bold"
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                        className="font-mono"
                                                    >
                                                        {standing.points}
                                                    </text>
                                                </g>
                                            )}
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}

                    {driverStandingsEvolution.map(s => {
                        const color = TEAM_COLORS[s.driver.team] || '#888';
                        return (
                            <path
                                key={s.driver.id}
                                d={buildPath(s.standings.map(st => st.totalPoints))}
                                fill="none"
                                stroke={color}
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                strokeDasharray={driverStrokeDashArray[s.driver.id]}
                                opacity="0.9"
                            />
                        );
                    })}

                    {driverStandingsEvolution.map(s => {
                        const color = TEAM_COLORS[s.driver.team] || '#888';
                        const finalY = getY(s.standings[s.standings.length - 1].totalPoints);
                        const labelY = labelPositions[s.driver.id];
                        return (
                            <g key={`label-${s.driver.id}`}>
                                <circle cx={finalX} cy={finalY} r="2.5" fill={color} />
                                <line
                                    x1={finalX} y1={finalY}
                                    x2={finalX + 8} y2={labelY}
                                    stroke={color}
                                    strokeWidth="0.5"
                                    opacity="0.6"
                                />
                                <text
                                    x={finalX + 10} y={labelY}
                                    fill={color} fontSize="9"
                                    dominantBaseline="middle"
                                    className="font-mono"
                                >
                                    {s.driver.abbreviation} {s.standings[s.standings.length - 1].totalPoints}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
