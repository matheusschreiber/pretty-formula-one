import Header from './components/header'
import DriversTable from './components/driverstable'
import RaceTable from './components/racetable'

import { ContextProvider } from './components/context-provider'

import Misc from './components/misc'

function App() {
    return (
        <ContextProvider>
            <Header />
            <div className='mt-10 lg:flex lg:justify-around justify-center hidden'>
                <DriversTable />
                <Misc />
                <RaceTable />
            </div>

            <div className='mt-10 flex flex-col justify-center lg:hidden'>
                <Misc />
                <DriversTable />
                <RaceTable />
            </div>
        </ContextProvider>
    )
}

export default App
