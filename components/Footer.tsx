import React from 'react';

interface FooterProps {
  onAdminModeToggle: () => void;
  isAdmin: boolean;
  onShowReport: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminModeToggle, isAdmin, onShowReport }) => {
  return (
    <footer className="text-center p-4 mt-8">
      <p className="text-xs text-slate-500">
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
          className="font-bold text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
          title="Activar modo administrador"
        >
          Acceso Administrador
        </span>
        {isAdmin && (
          <>
            {' | '}
            <span
              onClick={onShowReport}
              className="font-bold text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
              title="Abrir panel de administrador"
            >
              Panel Admin
            </span>
          </>
        )}
      </p>
    </footer>
  );
};

export default Footer;