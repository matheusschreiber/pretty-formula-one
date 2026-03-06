import alpine from '../assets/icons/alpine.png'   
import audi from '../assets/icons/audi.png'     
import haas from '../assets/icons/haas.png'     
import mercedes from '../assets/icons/mercedes.png'  
import redbull from '../assets/icons/redbull.png'

import amartin from '../assets/icons/amartin.png'  
import ferrari from '../assets/icons/ferrari.png'  
import mclaren from '../assets/icons/mclaren.png'  
import rbracing from '../assets/icons/redbull.png'  
import williams from '../assets/icons/williams.png'

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
            return rbracing;
        case 'Alpine':
            return alpine;
        case 'Aston Martin':
            return amartin;
        case 'Williams':
            return williams;
        case 'Haas F1 Team':
            return haas;
        case 'Kick Sauber':
        case 'Sauber':
        case 'Audi':
            return audi;
        default:
            return '';
    }
} 