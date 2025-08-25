import React from 'react';
import type { RaffleSettings } from '../types';

interface HeaderProps {
  raffleSettings: RaffleSettings;
}

const Header: React.FC<HeaderProps> = ({ raffleSettings }) => {
  return (
    <header className="text-center p-4 md:p-6">
      <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] px-2">
        {raffleSettings.raffleName}
      </h1>
      
      <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-400 mt-2 px-2">
        {raffleSettings.prizeName}
      </p>
      
      <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1 px-2">
        {raffleSettings.prizeValue}
      </p>

      <p className="text-slate-300 mt-4 text-sm sm:text-base md:text-lg font-semibold max-w-2xl mx-auto px-2">
        ¡Participa y gana! Jugamos con las dos últimas cifras del sorteo <span className="font-bold text-yellow-300">{raffleSettings.lotteryName}</span>.
      </p>

      {/* Prize Image */}
      {raffleSettings.prizeImageUrl && (
        <div className="mt-6 max-w-4xl mx-auto px-2">
          <div className="bg-slate-800/50 rounded-lg border border-amber-400/30 shadow-lg overflow-hidden">
            <img
              src={raffleSettings.prizeImageUrl}
              alt={raffleSettings.prizeName}
              className="w-full h-32 sm:h-48 md:h-64 lg:h-80 object-cover"
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4 md:gap-6 max-w-lg mx-auto px-2">
        <div className="w-full sm:w-1/2 p-3 bg-slate-800/50 rounded-lg border border-teal-500/30 shadow-lg text-center">
          <p className="text-xs sm:text-sm font-semibold text-slate-400 tracking-wider uppercase">Valor Boleto</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-white mt-1">
            ${raffleSettings.ticketPrice.toLocaleString('es-CO')} <span className="text-sm font-normal text-slate-300">COP</span>
          </p>
        </div>
        <div className="w-full sm:w-1/2 p-3 bg-slate-800/50 rounded-lg border border-amber-400/30 shadow-lg text-center">
          <p className="text-xs sm:text-sm font-semibold text-slate-400 tracking-wider uppercase">Gran Premio</p>
          <p className="text-lg sm:text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 tracking-tight mt-1">
            {raffleSettings.prizeValue} <span className="text-sm font-normal text-amber-200">COP</span>
          </p>
        </div>
      </div>

    </header>
  );
};

export default Header;