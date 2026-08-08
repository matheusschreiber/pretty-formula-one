import alpine from '../assets/icons/alpine.png'   
import audi from '../assets/icons/audi.png'     
import haas from '../assets/icons/haas.png'     
import mercedes from '../assets/icons/mercedes.png'  
import redbull from '../assets/icons/redbull.png'
import cadillac from '../assets/icons/cadillac.png'
import amartin from '../assets/icons/amartin.png'  
import ferrari from '../assets/icons/ferrari.png'  
import mclaren from '../assets/icons/mclaren.png'  
import rbracing from '../assets/icons/rbracing.png'  
import williams from '../assets/icons/williams.png'
import sauber from '../assets/icons/sauber.png'
import alphatauri from '../assets/icons/alphatauri.png'
import alpharomeo from '../assets/icons/alpharomeo.png'
import kicksauber from '../assets/icons/kicksauber.png'

export const getTeamLogo = (team:string) => {
    switch (team) {
        case 'Ferrari':
            return ferrari;
        case 'Mercedes':
            return mercedes;
        case 'McLaren':
            return mclaren;
        case 'Red Bull Racing':
            return redbull;
        case 'RB':
        case 'Racing Bulls':
            return rbracing;
        case 'Alpine':
            return alpine;
        case 'Aston Martin':
            return amartin;
        case 'Williams':
            return williams;
        case 'Haas F1 Team':
            return haas;
        case 'Cadillac':
            return cadillac;
        case 'Sauber':
            return sauber;
        case 'Kick Sauber':
            return kicksauber;
        case 'Audi':
            return audi;
        case 'AlphaTauri':
            return alphatauri;
        case 'Alfa Romeo':
        case 'Alfa Romeo Racing':
            return alpharomeo;
        default:
            return '';
    }
} 