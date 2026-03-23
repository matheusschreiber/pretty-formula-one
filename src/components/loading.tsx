const Loading = () => {
  const d = "M 120 310 C 100 330 60 340 50 310 C 40 280 60 250 85 225 C 110 200 130 190 170 160 C 210 130 240 120 310 110 C 380 100 450 150 500 175 C 550 200 620 225 666 166 L 685 150 C 733 101 880 125 880 160 C 880 185 867 183 835 170 C 754 165 800 240 760 250 C 700 265 550 230 450 200 C 350 170 200 250 150 280 Z";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <style>
        {`
          @keyframes circuit-loop {
            from { stroke-dashoffset: 2200; }
            to { stroke-dashoffset: 200; }
          }

          .animate-ease {
            stroke-dasharray: 100 1900;
            animation: circuit-loop 1.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
          }
        `}
      </style>
      
      <svg 
        viewBox="0 0 950 400" 
        className="w-full max-w-3xl drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]"
      >
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-red-950/30"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-red-500 animate-ease drop-shadow-[0_0_8px_#ef4444]"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Loading data...
    </div>
  );
};

export default Loading;