import bahrain from '../assets/tracks/bahrain.png'
import saudiarabian from '../assets/tracks/saudiarabian.png'
import australian from '../assets/tracks/australian.png'
import japanese from '../assets/tracks/japanese.png'
import chinese from '../assets/tracks/chinese.png'
import miami from '../assets/tracks/miami.png'
import emiliaromagna from '../assets/tracks/emiliaromagna.png'
import monaco from '../assets/tracks/monaco.png'
import canadian from '../assets/tracks/canadian.png'
import spanish from '../assets/tracks/spanish.png'
import austrian from '../assets/tracks/austrian.png'
import british from '../assets/tracks/british.png'
import hungarian from '../assets/tracks/hungarian.png'
import belgian from '../assets/tracks/belgian.png'
import dutch from '../assets/tracks/dutch.png'
import italian from '../assets/tracks/italian.png'
import azerbaijan from '../assets/tracks/azerbaijan.png'
import singapore from '../assets/tracks/singapore.png'
import usa from '../assets/tracks/usa.png'
import mexico from '../assets/tracks/mexico.png'
import saopaulo from '../assets/tracks/saopaulo.png'
import lasvegas from '../assets/tracks/lasvegas.png'
import qatar from '../assets/tracks/qatar.png'
import abudhabi from '../assets/tracks/abudhabi.png'

export const getCircuitTrack = (circuitName: string): string => {
    switch (circuitName) {
        case 'Bahrain Grand Prix':
            return bahrain;
        case 'Saudi Arabian Grand Prix':
            return saudiarabian;
        case 'Australian Grand Prix':
            return australian;
        case 'Japanese Grand Prix':
            return japanese;
        case 'Chinese Grand Prix':
            return chinese;
        case 'Miami Grand Prix':
            return miami;
        case 'Emilia Romagna Grand Prix':
            return emiliaromagna;
        case 'Monaco Grand Prix':
            return monaco;
        case 'Canadian Grand Prix':
            return canadian;
        case 'Spanish Grand Prix':
            return spanish;
        case 'Austrian Grand Prix':
            return austrian;
        case 'British Grand Prix':
            return british;
        case 'Hungarian Grand Prix':
            return hungarian;
        case 'Belgian Grand Prix':
            return belgian;
        case 'Dutch Grand Prix':
            return dutch;
        case 'Italian Grand Prix':
            return italian;
        case 'Azerbaijan Grand Prix':
            return azerbaijan;
        case 'Singapore Grand Prix':
            return singapore;
        case 'United States Grand Prix':
            return usa;
        case 'Mexico City Grand Prix':
            return mexico;
        case 'São Paulo Grand Prix':
            return saopaulo;
        case 'Las Vegas Grand Prix':
            return lasvegas;
        case 'Qatar Grand Prix':
            return qatar;
        case 'Abu Dhabi Grand Prix':
            return abudhabi;
        default:
            return '';
    }
}
