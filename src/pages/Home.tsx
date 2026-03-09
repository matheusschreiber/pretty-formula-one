import Header from '../components/header'
import DriversTable from '../components/home/tables/driverstable'
import RaceTable from '../components/home/tables/racetable'

import Misc from '../components/home/misc'
import Footer from '../components/footer'

function App() {
    return (
        <>
            <Header />
            <div className='mt-10 lg:flex lg:gap-5 justify-center hidden'>
                <DriversTable />
                <Misc />
                <RaceTable />
            </div>

            <div className='mt-10 flex flex-col justify-center lg:hidden'>
                <Misc />
                <DriversTable />
                <RaceTable />
            </div>
            <Footer />
        </>
    )
}

export default App
