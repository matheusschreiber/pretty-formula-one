import { useContext } from "react";
import { Context } from "./context-provider";
import { CarouselSelector } from "./carousel";
import CircuitMap from "./circuit-map";

export default function Misc() {

    const { year, setYear, round, rounds, roundIdx, setRoundIdx } = useContext(Context)!;

    return (
        <>
            <div>
                <CarouselSelector
                        label="Season"
                        value={year}
                        min={2000}
                        max={new Date().getFullYear()}
                        onPrev={() => { setYear(year > 2000 ? year - 1 : year); setRoundIdx(1) }}
                        onNext={() => { setYear(year < new Date().getFullYear() ? year + 1 : year); setRoundIdx(1) }}
                    />

                <CircuitMap 
                    round={round} 
                    onPrev={() => setRoundIdx(roundIdx > 1 ? roundIdx - 1 : roundIdx)}
                    onNext={() => setRoundIdx(roundIdx < rounds.length ? roundIdx + 1 : roundIdx)}
                    canPrev={roundIdx > 1}
                    canNext={roundIdx < rounds.length}
                />

                <div className="flex lg:flex-row flex-col gap-12 mb-5">
                    

                    {/* <CarouselSelector
                        label="Round"
                        value={roundIdx}
                        min={1}
                        max={rounds.length}
                        displayValue={roundIdx}
                        onPrev={() => setRoundIdx(roundIdx > 1 ? roundIdx - 1 : roundIdx)}
                        onNext={() => setRoundIdx(roundIdx < rounds.length ? roundIdx + 1 : roundIdx)}
                    /> */}
                </div>
            </div>
        </>
    )
}