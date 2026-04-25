import { useContext } from "react";
import { Context } from "../context-provider";
import { CarouselSelector } from "./carousel";
import CircuitMap from "./circuit-map";
import TelemetryPageCard from "./telemetry-card";
import TyreStrategyCard from "./tyre-strategy";

export default function Misc() {
    
    const { 
        years, year, setYear,  
        rounds, round, setRound
    } = useContext(Context);

    function getNextYear(){
        setYear(years[years.indexOf(year)+1]); 
        setRound(rounds[0])
    }

    function getPreviousYear(){
        setYear(years[years.indexOf(year)-1]); 
        setRound(rounds[0])
    }

    function getNextRound(){
        const nextIndex = Math.max(1, Math.min(round.index + 1, rounds.length));
        const nextRound = rounds.find(r => r.index === nextIndex);
        if (nextRound) setRound(nextRound);
    }

    function getPreviousRound(){
        const prevIndex = Math.max(1, Math.min(round.index - 1, rounds.length));
        const prevRound = rounds.find(r => r.index === prevIndex);
        if (prevRound) setRound(prevRound);
    }

    if (!round || rounds.length === 0 || !year || years.length === 0) {
        return <></>
    }
    
    return (
        <div className="min-h-screen flex flex-col justify-between">
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
                <div className="flex flex-col justify-between gap-5 my-5">
                    <TelemetryPageCard round={round} />
                    <TyreStrategyCard round={round} />
                    <CircuitMap round={round} />
                </div>
            )}
            
            {(!round || rounds.length === 0) ? (
                <p className="text-center mt-10">Data not found :(</p>
            ) : (<></>)}

            <div className="flex justify-center items-center gap-10 mt-5">
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
        </div>
    )
}