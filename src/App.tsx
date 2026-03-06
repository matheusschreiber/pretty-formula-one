import Header from './components/header'
import DriversTable from './components/driverstable'
import RaceTable from './components/racetable'

import { ContextProvider } from './components/context-provider'

import Misc from './components/misc'

function App() {
    return (
        <ContextProvider>
            <Header />
            <div className='mt-10 flex justify-around'>
                <DriversTable />
                <Misc />
                <RaceTable />
            </div>
        </ContextProvider>
    )
}

export default App
