import bahrain from "../assets/flags/bahrain.png";
import saudiarabia from "../assets/flags/Saudi Arabia.png"
import australia from "../assets/flags/Australia.png"
import japan from "../assets/flags/Japan.png"
import china from "../assets/flags/China.png"
import usa from "../assets/flags/USA.png"
import italy from "../assets/flags/Italy.png"
import monaco from "../assets/flags/Monaco.png"
import canada from "../assets/flags/Canada.png"
import spain from "../assets/flags/Spain.png"
import austria from "../assets/flags/Austria.png"
import britain from "../assets/flags/Britain.png"
import hungary from "../assets/flags/Hungary.png"
import belgium from "../assets/flags/Belgium.png"
import netherlands from "../assets/flags/Netherlands.png"
import azerbaijan from "../assets/flags/Azerbaijan.png"
import singapore from "../assets/flags/Singapore.png"
import mexico from "../assets/flags/Mexico.png"
import brazil from "../assets/flags/Brazil.png"
import qatar from "../assets/flags/Qatar.png"
import uae from "../assets/flags/United Arab Emirates.png"


export const getCountryFlagIcon = (country:string | undefined) => {
    const countryFlags: { [key: string]: string } = {
        "Bahrain": bahrain,
        "Saudi Arabia": saudiarabia,
        "Australia": australia,
        "Japan": japan,
        "China": china,
        "United States": usa,
        "Italy": italy,
        "Monaco": monaco,
        "Canada": canada,
        "Spain": spain,
        "Austria": austria,
        "United Kingdom": britain,
        "Hungary": hungary,
        "Belgium": belgium,
        "Netherlands": netherlands,
        "Azerbaijan": azerbaijan,
        "Singapore": singapore,
        "Mexico": mexico,
        "Brazil": brazil,
        "Qatar": qatar,
        "United Arab Emirates": uae,
    };
    return country ? countryFlags[country] : "";
};