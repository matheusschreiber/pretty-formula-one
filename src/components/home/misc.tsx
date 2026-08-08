import { useContext } from "react";
import { Context } from "../context-provider";
import { CarouselSelector } from "./carousel";
import CircuitMap from "./circuit-map";
import TelemetryPageCard from "./telemetry-card";
import ChampionshipCard from "./championship-card";
import ReplayModeCard from "./replaymode-card";

export default function Misc() {

    const { 
        years, year,  
        rounds, round,
        onChangeYear, onChangeRound
    } = useContext(Context);

    async function getNextYear(){
        const nextYear = years[years.indexOf(year)+1]
        await onChangeYear(nextYear);
    }

    async function getPreviousYear(){
        const prevYear = years[years.indexOf(year)-1]
        await onChangeYear(prevYear);
    }

    async function getNextRound(){
        const nextIndex = Math.max(1, Math.min(round.index + 1, rounds.length));
        const nextRound = rounds.find(r => r.index === nextIndex);
        await onChangeRound(nextRound?.index || 1);
    }

    async function getPreviousRound(){
        const prevIndex = Math.max(1, Math.min(round.index - 1, rounds.length));
        const prevRound = rounds.find(r => r.index === prevIndex);
        await onChangeRound(prevRound?.index || 1);
    }

    if (!round || rounds.length === 0 || !year || years.length === 0) {
        return <></>
    }
    
    return (
        <div className="flex flex-col justify-between">
            <div className="flex justify-center items-center gap-10">
                <CarouselSelector
                    label="Season"
                    value={year}
                    min={years[0]}
                    max={years[years.length-1]}
                    onPrev={() => getPreviousYear()}
                    onNext={() => getNextYear()}
                />

                <CarouselSelector
                    label="Round"
                    value={round.index}
                    min={1}
                    max={rounds.slice(-1)[0].index}
                    onPrev={() => getPreviousRound()}
                    onNext={() => getNextRound()}
                />
            </div>

            {round && rounds.length > 0 && (
                <div className="flex flex-col justify-between gap-5 mt-5">
                    <CircuitMap round={round} />
                    <TelemetryPageCard round={round} />
                    <ChampionshipCard year={year} rounds={rounds} />
                    {/* <TyreStrategyCard round={round} /> */}
                    <ReplayModeCard year={year} round={round} />
                </div>
            )}
            
            {(!round || rounds.length === 0) ? (
                <p className="text-center mt-10">Data not found :(</p>
            ) : (<></>)}
        </div>
    )
}