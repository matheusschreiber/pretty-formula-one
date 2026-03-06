import chevron_left from "../assets/icons/chevron_left.svg"
import chevron_right from "../assets/icons/chevron_right.svg"

export const CarouselSelector = ({ 
    label, 
    value, 
    onPrev, 
    onNext, 
    displayValue 
}: { 
    label: string, 
    value: number, 
    onPrev: () => void, 
    onNext: () => void, 
    displayValue?: string | number 
}) => (
    <div className="flex flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">{label}</span>
        <div className="flex items-center gap-4 bg-gray-primary/50 p-2 rounded-full border border-gray-light">
            <button 
                onClick={onPrev}
                className="hover:text-primary transition-colors p-2"
            >
                <img src={chevron_left} alt="Previous" className="w-4" />
            </button>
            
            <div className="w-32 text-center">
                <span className="text-2xl font-bold font-kdam text-white">
                    {displayValue || value}
                </span>
            </div>

            <button 
                onClick={onNext}
                className="hover:text-primary transition-colors p-2"
            >
                <img src={chevron_right} alt="Next" className="w-4" />
            </button>
        </div>
    </div>
);