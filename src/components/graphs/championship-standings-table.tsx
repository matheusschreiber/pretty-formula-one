import { useState } from "react"
import type { DriverStandings } from "../../utils/championship"
import { getCountryFlagIcon } from "../../utils/country-flags"
import { TEAM_COLORS } from "../../utils/teams-colors"

interface Props {
    driverStandingsEvolution: DriverStandings[]
}

function positionCellClass(position: number): string {
    if (position === -1) return "bg-red-900/60 text-red-200"
    if (position === 1) return "text-yellow-300 font-bold bg-yellow-900/30"
    if (position === 2) return "text-gray-300 font-bold"
    if (position === 3) return "text-amber-600 font-bold"
    if (position >= 4 && position <= 10) return "text-white"
    return "text-gray-500"
}

function positionLabel(position: number): string {
    if (position === -1) return "DNF"
    if (position === 0) return "—"
    return String(position)
}

export default function ChampionshipStandingsTable({driverStandingsEvolution}:Props) {

    const [hoveredCol, setHoveredCol] = useState<number | null>(null)

    return (
        <div className="p-10 rounded-3xl border border-gray-primary overflow-hidden">
            <table className="w-full text-center border-collapse font-mono">
                <thead>
                    <tr>
                        <th></th>
                        {
                            driverStandingsEvolution[0]?.standings.map((s, colIdx) => (
                                <th key={s.round.id}
                                    onMouseEnter={() => setHoveredCol(colIdx)}
                                    onMouseLeave={() => setHoveredCol(null)}
                                    className="relative">
                                    <span
                                        className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-1 whitespace-nowrap text-xs uppercase tracking-wide pointer-events-none transition-opacity ${hoveredCol === colIdx ? 'opacity-100' : 'opacity-0'}`}
                                    >
                                        {s.round.name}
                                    </span>
                                    <img src={getCountryFlagIcon(s.round.country)}
                                        title={s.round.name} 
                                        alt={s.round.country} className="h-5 my-5 mx-auto" /> 
                                </th>
                            ))
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        driverStandingsEvolution.map((ds, index) => (
                            <tr key={index} className="h-10 odd:bg-white/5 even:bg-transparent">
                                <td className="flex justify-center items-center py-2">
                                    <img src={ds.driver.teamLogo} alt={ds.driver.name} 
                                        className="max-h-5 max-w-5 mr-2" 
                                        title={ds.driver.team} />
                                    <p className="font-bold" 
                                    style={{color: TEAM_COLORS[ds.driver.team]}}>
                                        {ds.driver.abbreviation}
                                    </p>
                                </td>
                                
                                {ds.standings.map((s, colIdx) => (
                                    <td key={s.round.id}
                                        onMouseEnter={() => setHoveredCol(colIdx)}
                                        onMouseLeave={() => setHoveredCol(null)}
                                        className={positionCellClass(s.position) + (hoveredCol === colIdx ? ' bg-white/10' : '')}>
                                        {positionLabel(s.position)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}