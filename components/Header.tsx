import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center p-4 md:p-6">
      <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
        Gran Rifa SAMMY
      </h1>
      <p className="text-indigo-200 mt-2 text-base md:text-lg font-semibold max-w-2xl mx-auto">
        ¡Participa y gana! Jugamos con las dos últimas cifras del sorteo <span className="font-bold text-yellow-300">Sinuano Noche</span>.
      </p>
    </header>
  );
};

export default Header;