import bahrain from '../assets/circuits/bahrain.png'
import saudiarabian from '../assets/circuits/saudiarabian.png'
import australian from '../assets/circuits/australian.png'
import japanese from '../assets/circuits/japanese.png'
import chinese from '../assets/circuits/chinese.png'
import miami from '../assets/circuits/miami.png'
import emiliaromagna from '../assets/circuits/emiliaromagna.png'
import monaco from '../assets/circuits/monaco.png'
import canadian from '../assets/circuits/canadian.png'
import spanish from '../assets/circuits/spanish.png'
import austrian from '../assets/circuits/austrian.png'
import british from '../assets/circuits/british.png'
import hungarian from '../assets/circuits/hungarian.png'
import belgian from '../assets/circuits/belgian.png'
import dutch from '../assets/circuits/dutch.png'
import italian from '../assets/circuits/italian.png'
import azerbaijan from '../assets/circuits/azerbaijan.png'
import singapore from '../assets/circuits/singapore.png'
import usa from '../assets/circuits/usa.png'
import mexico from '../assets/circuits/mexico.png'
import saopaulo from '../assets/circuits/saopaulo.png'
import lasvegas from '../assets/circuits/lasvegas.png'
import qatar from '../assets/circuits/qatar.png'
import abudhabi from '../assets/circuits/abudhabi.png'

export const getBackgroundImage = (circuitName: string): string => {
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
