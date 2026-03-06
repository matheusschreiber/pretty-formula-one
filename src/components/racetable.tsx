
import { useContext } from 'react';
import { Context } from './context-provider';

export default function Racetable() {

    const { round } = useContext(Context)!;

    if (!round) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <div className="bg-main-dark overflow-clip w-100 border border-gray-primary rounded-3xl">
                <div className="flex flex-col items-center justify-center gap-2 mb-4">
                    <div className='flex items-center justify-center w-full h-36 bg-cover bg-no-repeat bg-center' style={{ backgroundImage: `url(${round?.backgroundImage})` }}>
                        <p className="text-center text-3xl">
                            {round && round.name}
                        </p>
                    </div>
                </div>


                <table className="w-full border-separate border-spacing-y-2 px-4">
                    <thead>
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                            {/* <th></th> */}
                            <th className='text-gray-light text-[.6rem] text-center'>RACE</th>
                            <th className='text-gray-light text-[.6rem] text-center'>SPRINT</th>
                            <th className='text-gray-light text-[.6rem] text-center'>TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {round && round.results && round.results.map((result, index) => result.driver && (
                            <tr key={index}>
                                <td className='text-center px-2 h-6'>{(index + 1).toString().padStart(2, '0')}</td>
                                <td className='px-2'>
                                    <img className='w-5 mx-auto' src={result.driver.teamLogo} alt={result.driver.team} />
                                </td>
                                <td className='text-center px-2'>{result.driver.abbreviation}</td>
                                {/* <td className="text-gray-light px-2">
                                    <p className="truncate w-30">{result.driver.name}</p>
                                </td> */}
                                <td className="text-[.7rem] text-gray-light px-2">+{result.racePoints.toFixed(1)}</td>
                                <td className="text-[.7rem] text-gray-light text-center px-2">+{result.sprintPoints.toFixed(1)}</td>
                                <td className="text-center px-2">+{(result.sprintPoints + result.racePoints).toFixed(1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}