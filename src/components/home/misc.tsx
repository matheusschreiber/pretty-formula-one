import { useContext } from "react";
import { Context } from "../context-provider";
import { CarouselSelector } from "./carousel";
import CircuitMap from "./circuit-map";
import TelemetryPageCard from "./telemetry-card";
import HelmetCarousel from "./helmet-carousel/helmet-carousel";

export default function Misc() {

    const { year, setYear, yearsAvailable, round, rounds, roundIdx, setRoundIdx } = useContext(Context)!;

    function getNextYear(){
        setYear(yearsAvailable[yearsAvailable.indexOf(year)+1]); 
        setRoundIdx(1)
    }

    function getPreviousYear(){
        setYear(yearsAvailable[yearsAvailable.indexOf(year)-1]); 
        setRoundIdx(1)
    }

    return (
        <div className="min-h-screen">
            <div className="flex justify-center items-center gap-10">
                <CarouselSelector
                    label="Season"
                    value={year}
                    min={yearsAvailable[yearsAvailable.length-1]}
                    max={yearsAvailable[0]}
                    onPrev={() => getNextYear()}
                    onNext={() => getPreviousYear()}
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
                <>
                    <CircuitMap round={round} />
                    <TelemetryPageCard round={round} />
                    <HelmetCarousel />
                </>
            )}

            {(!round || rounds.length === 0) ? (
                <p className="text-center mt-10">Data not found :(</p>
            ) : (<></>)}
        </div>
    )
}