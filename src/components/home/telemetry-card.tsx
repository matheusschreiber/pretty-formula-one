import { ShipWheel } from "lucide-react";
import type { Round } from "../../utils/types";
import { getCountryFlagIcon } from "../../utils/country-flags";


export default function TelemetryPageCard({round}: {round: Round | undefined}) {

    return (
        <a href="/graphs">
            <div className="group lg:w-125 lg:mb-0 mb-5 lg:mx-0 mx-5 border border-gray-primary overflow-hidden rounded-4xl bg-zinc-950 
                bg-no-repeat bg-cover bg-center hover:border-primary transition-colors cursor-pointer"
                style={{ backgroundImage: `url(${round?.backgroundImage})` }}>

                <div style={{background: "linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)"}}
                    className="pb-10 group-hover:pl-5 transition-all duration-200">
                    <div className="px-10 pt-10 text-gray-light flex items-center gap-2">
                        <ShipWheel className="inline-block" />
                        <p className="text-sm font-bold">Telemetry Data</p>
                    </div>
                    <div className="flex items-center px-10 mt-2">
                        {round && round.country && (
                            <img src={getCountryFlagIcon(round.country)} alt={round.country} className="h-5 mr-2" /> 
                        )}
                        <p className="text-3xl">{round?.country}</p>
                    </div>
                </div>

                <div className="pt-20 pb-5 w-full" 
                    style={{background: "linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)"}}>
                    <div className="pl-2 mx-10 w-fit border-l-4 border-primary
                        group-hover:ml-15 transition-all duration-400">
                        <p className="text-2xl">Brake & Throttle</p>
                        <p className="text-lg text-gray-light">GEARS</p>
                        <p className="text-sm text-zinc-600">RPM</p>
                    </div>
                    <p className="text-8xl ml-[60%] -mb-15 -mt-10 text-red-400 mr-auto
                        group-hover:-mb-3 group-hover:-mt-22 transition-all duration-500">
                        {round?.index && (round.index).toString().padStart(2, '0')}
                    </p>
                </div>
            </div>
        </a>
    )
}