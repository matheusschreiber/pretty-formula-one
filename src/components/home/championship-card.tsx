import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import placeholderDriverIcon from '../../assets/icons/placeholder-white.png';
import { Medal } from "lucide-react";
import { getStandingsPerRound } from "../../utils/championship";
import type { Round } from "../../utils/types";

const scaleVariants: Variants = {
    idle: { width: "5rem" },
    hover: (i: number) => ({
        width: "3rem",
        transition: {
            type: "spring",
            stiffness: 160,
            damping: 20,
            delay: 0.05 + i * 0.06
        }
    })
};

const titleVariants: Variants = {
    rest: { scale: 1, marginTop: "1rem" },
    hover: {
        scale: 0.8,
        marginTop: "0.5rem",
        transition: { type: "spring", stiffness: 220, damping: 26 }
    }
};

const revealVariants: Variants = {
    hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
    show: (i: number) => ({
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 160,
            damping: 20,
            delay: 0.05 + i * 0.06
        }
    }),
    exit: {
        opacity: 0,
        y: 12,
        filter: "blur(4px)",
        transition: { duration: 0.15 }
    }
};

const dividerVariants: Variants = {
    hidden: { opacity: 0, scaleX: 0.4 },
    show: (i: number) => ({
        opacity: 1,
        scaleX: 1,
        transition: {
            type: "spring",
            stiffness: 220,
            damping: 22,
            delay: i * 0.06
        }
    }),
    exit: {
        opacity: 0,
        scaleX: 0.4,
        transition: { duration: 0.15 }
    }
};

interface Props {
    year: number;
    rounds: Round[];
}

export default function ChampionshipCard({ year, rounds }: Props) {
    const [hovered, setHovered] = useState(false);

    const lastStandings = useMemo(()=>{
        return getStandingsPerRound(rounds).slice(-1)[0].standings.slice(0, 4);
    }, [rounds]);

    if (!year || !rounds || rounds.length === 0) {
        return <></>;
    }

    return (
        <Link
            to={"/championship?year=" + year.toString()}
            className="group"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >

            <div className="lg:w-125 lg:mb-0 lg:mx-0 mx-5 border h-42.5
                    border-gray-primary overflow-hidden rounded-4xl 
                    bg-zinc-950 bg-no-repeat bg-cover bg-center 
                    hover:border-primary transition-colors cursor-pointer"
                    style={{ backgroundImage: 'url(/src/assets/bgs/ferrari.png)' }}>
                <motion.div
                    className="w-full flex items-center justify-center"
                    initial="rest"
                    animate={hovered ? "hover" : "rest"}
                    variants={titleVariants}
                >
                    <p className="text-white group-hover:text-primary 
                        transition-all ease-in duration-400">
                        <Medal className="w-8 h-8 inline-block mr-2 my-0" />
                    </p>
                    <p className="text-3xl font-bold text-white text-center uppercase">
                        {year} Standings
                    </p>
                </motion.div>
                <motion.div layout className="flex justify-center gap-5 my-5">
                    {lastStandings.map((standing, index) => (
                        <motion.div
                            layout
                            key={index}
                            className="flex flex-col items-center gap-2"
                            title={standing.driver.name}
                        >
                            <motion.div
                                custom={index}
                                variants={scaleVariants}
                                initial="idle"
                                animate={hovered ? "hover" : "idle"}
                                className="w-20 rounded-full overflow-hidden
                                    bg-[repeating-linear-gradient(45deg,#750704_0_2px,transparent_2px_5px)]
                                    flex items-center justify-center"
                            >
                                <img src={standing.driver.photo || placeholderDriverIcon}
                                    alt="Driver" className="w-full h-auto max-h-20" />
                            </motion.div>

                            <AnimatePresence initial={false}>
                                <motion.div
                                    key="divider"
                                    custom={index}
                                    variants={dividerVariants}
                                    initial="hidden"
                                    animate={hovered ? "show" : "hidden"}
                                    exit="exit"
                                    className="w-[80%] h-1 bg-red-500 rounded-full origin-center"
                                />
                            </AnimatePresence>

                            <AnimatePresence initial={false}>
                                <motion.p
                                    key="points"
                                    custom={index}
                                    variants={revealVariants}
                                    initial="hidden"
                                    animate={hovered ? "show" : "hidden"}
                                    exit="exit"
                                >
                                    <b className="text-xl">{standing.points.toFixed(1)}</b>{" "}
                                    <span className="text-gray-light text-sm">pts</span>
                                </motion.p>
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </Link>
    );
}