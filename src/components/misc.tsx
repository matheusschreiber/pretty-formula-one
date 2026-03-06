import { useContext } from "react";
import { Context } from "./context-provider";
import { CarouselSelector } from "./carousel";

export default function Misc() {

    const {year, setYear, round, rounds, roundIdx, setRoundIdx} = useContext(Context)!;

    return (
        <div className="flex flex-col gap-5"> 
            <CarouselSelector 
                label="Season"
                value={year}
                onPrev={() => setYear(year > 2000 ? year - 1 : year)}
                onNext={() => setYear(year < new Date().getFullYear() ? year + 1 : year)}
            />

            <CarouselSelector 
                label="Round"
                value={roundIdx}
                displayValue={round?.name.split(' ')[0]}
                onPrev={() => setRoundIdx(roundIdx > 1 ? roundIdx - 1 : roundIdx)}
                onNext={() => setRoundIdx(roundIdx < rounds.length ? roundIdx + 1 : roundIdx)}
            />
        </div>
    )
}