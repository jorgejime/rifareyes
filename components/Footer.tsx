import React from 'react';

interface FooterProps {
  onAdminModeToggle: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminModeToggle }) => {
  return (
    <footer className="text-center p-4 mt-8">
      <p className="text-xs text-indigo-400">
        Desarrollado por EIDEA SAS (
        <a
          href="https://www.centroeidea.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          www.centroeidea.com
        </a>
        ) |{' '}
        <span
          onClick={onAdminModeToggle}
          className="font-bold text-indigo-300 hover:text-yellow-400 transition-colors cursor-pointer"
          title="Activar modo administrador"
        >
          Acceso Administrador
        </span>
      </p>
    </footer>
  );
};

export default Footer;