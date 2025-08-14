import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center p-4 md:p-6">
      <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
        Gran Rifa SAMMY
      </h1>
      <p className="text-slate-300 mt-2 text-base md:text-lg font-semibold max-w-2xl mx-auto">
        ¡Participa y gana! Jugamos con las dos últimas cifras del sorteo <span className="font-bold text-yellow-300">Sinuano Noche</span>.
      </p>

      <div className="mt-6 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6 max-w-lg mx-auto">
        <div className="w-full md:w-1/2 p-3 bg-slate-800/50 rounded-lg border border-teal-500/30 shadow-lg text-center">
          <p className="text-sm font-semibold text-slate-400 tracking-wider uppercase">Valor Boleto</p>
          <p className="text-2xl font-bold text-white mt-1">$20.000 <span className="text-base font-normal text-slate-300">COP</span></p>
        </div>
        <div className="w-full md:w-1/2 p-3 bg-slate-800/50 rounded-lg border border-amber-400/30 shadow-lg text-center">
          <p className="text-sm font-semibold text-slate-400 tracking-wider uppercase">Gran Premio</p>
          <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 tracking-tight mt-1">
            $1.000.000 <span className="text-base font-normal text-amber-200">COP</span>
          </p>
        </div>
      </div>

    </header>
  );
};

export default Header;