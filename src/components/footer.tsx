import logo from '../assets/logo.svg'
import senna from '../assets/ayrtonsenna.png'
import githubIcon from '../assets/icons/github.svg'


export default function Footer() {

    return (

        <div className='bg-linear-to-r from-[#171717] to-[#141414] mt-10'>
            <div className="w-full px-20 flex gap-20 pt-20 lg:flex-row flex-col">
                <div>
                    <img src={logo} alt="Logo" />
                    <p className='text-gray-light mt-2 lg:w-100'>
                        Fan-made website that has no official connections to the F1
                        related organizations.
                    </p>
                </div>
                <div className='flex flex-col gap-3'>
                    <p className='font-bold'>NAVIGATION</p>
                    <a href="/" className='text-gray-light hover:underline'><p>Home</p></a>
                    <a href="/graphs" className='text-gray-light hover:underline'><p>Graphs</p></a>
                </div>
                <div className='flex flex-col gap-3'>
                    <p className='font-bold'>BUILT WITH</p>
                    <p className='text-gray-light'>Vite | React</p>
                    <p className='text-gray-light'>FastF1</p>
                </div>
                <img className='max-h-100 aspect-auto hidden lg:block ml-auto -mt-15 -mb-28' src={senna} alt="Ayrton Senna" />
            </div>
            <div className="pl-20 w-full lg:mt-0 mt-10 lg:pr-0 pr-20 pb-10">
                <div className='mb-4 ml-4 flex items-center'>
                    <img src={githubIcon} alt="GitHub" className='h-6 mr-2' />
                    <a href="https://github.com/matheusschreiber/pretty-formula-one" 
                    className="text-gray-light hover:underline">Repo</a>
                </div>
                <div className="border-b-2 border-gray-primary"></div>
                <p className="text-zinc-700 mt-2">
                    For bugs or suggestions please use the <a href="https://github.com/matheusschreiber/pretty-formula-one" 
                    className=" hover:underline">Github Repo</a>.
                </p>
            </div>
            <img className='max-h-100 aspect-auto lg:hidden block' src={senna} alt="Ayrton Senna" />
        </div>
    )
} 