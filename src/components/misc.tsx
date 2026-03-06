import { useContext } from "react";
import { Context } from "./context-provider";
import { CarouselSelector } from "./carousel";
import CircuitMap from "./circuit-map";
import TelemetryPageCard from "./telemetry-card";

export default function Misc() {

    const { year, setYear, round, rounds, roundIdx, setRoundIdx } = useContext(Context)!;

    return (
        <div>
            <div className="flex justify-center items-center gap-10">
                <CarouselSelector
                    label="Season"
                    value={year}
                    min={2000}
                    max={new Date().getFullYear()}
                    onPrev={() => { setYear(year > 2000 ? year - 1 : year); setRoundIdx(1) }}
                    onNext={() => { setYear(year < new Date().getFullYear() ? year + 1 : year); setRoundIdx(1) }}
                />

                <CarouselSelector
                    label="Round"
                    value={roundIdx}
                    min={1}
                    max={rounds.length}
                    onPrev={() => { setRoundIdx(roundIdx > 1 ? roundIdx - 1 : roundIdx) }}
                    onNext={() => { setRoundIdx(roundIdx < rounds.length ? roundIdx + 1 : roundIdx) }}
                />
            </div>

            {round && rounds.length > 0 && (
                <CircuitMap round={round} />
            )}

            <TelemetryPageCard round={round} />

            {(!round || rounds.length === 0) ? (
                <p className="text-center mt-10">Data not found :(</p>
            ) : (<></>)}
        </div>
    )
}