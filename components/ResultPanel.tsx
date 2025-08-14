import React from 'react';
import type { RaffleTicket, UserInfo } from '../types';

interface PurchasePanelProps {
  selectedNumbers: string[];
  userInfo: UserInfo;
  onUserInfoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmPurchase: () => void;
  onResetPurchase: () => void;
  viewingTicket: { number: string; data: RaffleTicket } | null;
  isAdmin: boolean;
  onMarkAsSold: () => void;
  onReleaseTicket: () => void;
  showConfirmation: boolean;
}

const WHATSAPP_NUMBER = "573189747253";
const NEQUI_NUMBER = "318-413-1391";
const TICKET_PRICE = 20000;

const InfoRow: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
  <div className={`flex justify-between items-center py-2 border-b border-indigo-700/50 ${className}`}>
    <span className="text-sm text-indigo-300">{label}</span>
    <span className="font-bold text-white text-lg text-right">{value}</span>
  </div>
);

const PurchaseForm: React.FC<Omit<PurchasePanelProps, 'viewingTicket' | 'isAdmin' | 'onMarkAsSold' | 'onReleaseTicket'>> = ({
  selectedNumbers,
  userInfo,
  onUserInfoChange,
  onConfirmPurchase,
  onResetPurchase,
  showConfirmation,
}) => {
  const total = selectedNumbers.length * TICKET_PRICE;
  const isFormValid = userInfo.name.trim() && userInfo.cedula.trim() && userInfo.whatsapp.trim();
  
  const formattedNumbers = selectedNumbers.join(', ');
  const whatsappMessage = encodeURIComponent(
    `Hola SAMMY, quiero confirmar mi reserva para la rifa. Ya realicé el pago a Nequi ${NEQUI_NUMBER} y adjunto mi comprobante.\n\n` +
    `*Números reservados:* ${formattedNumbers}\n` +
    `*Total pagado:* $${total.toLocaleString('es-CO')} COP\n\n` +
    `*Mis datos de registro:*\n` +
    `- Nombre: ${userInfo.name}\n` +
    `- Cédula: ${userInfo.cedula}\n\n` +
    `¡Muchas gracias!`
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  if (showConfirmation) {
    return (
      <div className="animate-fade-in text-center flex flex-col justify-center h-full">
        <h3 className="text-2xl font-bold text-green-400">¡Reserva Exitosa!</h3>
        <p className="text-indigo-200 mt-2">Tus números han sido apartados. Tienes <span className="font-bold text-yellow-300">30 minutos</span> para completar el pago y asegurar tu participación.</p>
        
        <div className="mt-4 p-3 bg-black/20 rounded-lg border border-indigo-700 text-left space-y-2">
            <p className="text-sm text-indigo-200">1. Paga <span className="font-bold text-white">${total.toLocaleString('es-CO')}</span> a nuestra cuenta Nequi:</p>
            <p className="text-2xl font-black text-yellow-400 text-center tracking-wider">{NEQUI_NUMBER}</p>
            <p className="text-sm text-indigo-200 mt-1">2. Envía el comprobante por WhatsApp para validar tu compra.</p>
        </div>
        
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center mt-4 py-3 px-6 text-white font-bold text-lg rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 active:scale-100 transition-transform"
        >
          Enviar Comprobante Ahora
        </a>
         <button onClick={onResetPurchase} className="w-full text-center mt-2 text-sm text-indigo-300 hover:text-yellow-400">Seleccionar otros números</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <InfoRow label="Números" value={selectedNumbers.length > 5 ? `${selectedNumbers.slice(0, 5).join(', ')}...` : formattedNumbers} />
        <InfoRow label="Total a Pagar" value={`$${total.toLocaleString('es-CO')} COP`} className="text-yellow-300" />
      </div>

      <div className="space-y-3 my-4">
        <input type="text" name="name" value={userInfo.name} onChange={onUserInfoChange} placeholder="Nombre Completo" className="w-full bg-indigo-950/50 border border-indigo-700 rounded-md p-2 text-white placeholder-indigo-400 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" required />
        <input type="text" name="cedula" value={userInfo.cedula} onChange={onUserInfoChange} placeholder="Cédula" className="w-full bg-indigo-950/50 border border-indigo-700 rounded-md p-2 text-white placeholder-indigo-400 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" required />
        <input type="tel" name="whatsapp" value={userInfo.whatsapp} onChange={onUserInfoChange} placeholder="Número de WhatsApp" className="w-full bg-indigo-950/50 border border-indigo-700 rounded-md p-2 text-white placeholder-indigo-400 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" required />
      </div>
      
      <div className="mt-4 p-3 bg-black/20 rounded-lg text-center">
        <p className="text-xs text-amber-300">IMPORTANTE: Debes enviar el comprobante en los próximos 30 minutos o la reserva se cancelará.</p>
      </div>

      <button
          onClick={isFormValid ? onConfirmPurchase : undefined}
          disabled={!isFormValid}
          className={`block w-full text-center mt-4 py-3 px-6 text-white font-bold text-lg rounded-lg shadow-lg transition-all duration-200 ${isFormValid ? 'bg-gradient-to-r from-indigo-600 to-purple-700 hover:scale-105 active:scale-100' : 'bg-gray-600 cursor-not-allowed'}`}
          aria-disabled={!isFormValid}
      >
        {isFormValid ? 'Reservar Números' : 'Completa tus datos'}
      </button>
      <button onClick={onResetPurchase} className="w-full text-center mt-2 text-sm text-indigo-300 hover:text-red-400">Cancelar Selección</button>
    </div>
  );
};

const TicketDetails: React.FC<Pick<PurchasePanelProps, 'viewingTicket' | 'isAdmin' | 'onMarkAsSold' | 'onReleaseTicket'>> = ({ viewingTicket, isAdmin, onMarkAsSold, onReleaseTicket }) => {
  if (!viewingTicket) return null;

  const { number, data } = viewingTicket;
  const statusConfig = {
    sold: { title: 'Número Vendido', color: 'text-red-400', message: 'Este número ya no está disponible.' },
    pending: { title: 'Pendiente de Pago', color: 'text-amber-400', message: 'Esperando la confirmación del pago.' },
    available: { title: '', color: '', message: ''},
  };
  const config = statusConfig[data.status];
  const reservationTime = data.reservationTimestamp ? new Date(data.reservationTimestamp).toLocaleString('es-CO') : 'N/A';

  return (
    <div className="flex flex-col h-full text-center">
        <p className="text-sm text-indigo-300">Detalles del Número</p>
        <p className="text-6xl font-black my-2 text-white">{number}</p>
        <h3 className={`text-2xl font-bold ${config.color}`}>{config.title}</h3>
        <p className="text-indigo-200 mt-2">{config.message}</p>
        
        {data.status === 'pending' && data.owner && (
            <div className="mt-4 text-left p-3 bg-black/20 rounded-lg border border-indigo-700/50">
                <InfoRow label="Nombre" value={data.owner.name} />
                <InfoRow label="Cédula" value={data.owner.cedula} />
                <InfoRow label="WhatsApp" value={data.owner.whatsapp} />
                <InfoRow label="Reservado" value={reservationTime} />
            </div>
        )}
        
        {isAdmin && data.status === 'pending' && (
            <div className="mt-auto pt-4 space-y-2">
                <button 
                    onClick={onMarkAsSold}
                    className="w-full py-2 px-4 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-500 transition-colors"
                >
                    Confirmar Pago (Vendido)
                </button>
                <button 
                    onClick={onReleaseTicket}
                    className="w-full py-2 px-4 bg-red-700 text-white font-bold rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                >
                    Liberar Número
                </button>
            </div>
        )}
    </div>
  );
};

const PurchasePanel: React.FC<PurchasePanelProps> = (props) => {
  const { selectedNumbers, viewingTicket } = props;

  const renderContent = () => {
    if (viewingTicket) {
      return <TicketDetails {...props} />;
    }
    
    if (selectedNumbers.length > 0) {
      return <PurchaseForm {...props} />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-48">
        <p className="text-indigo-200 text-center">Selecciona uno o más números del tablero para iniciar tu compra.</p>
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto text-left p-6 bg-indigo-900/50 backdrop-blur-sm border border-indigo-500/50 rounded-2xl shadow-2xl min-h-[300px] flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">Detalles de Compra</h2>
      <div className="flex-grow">
        {renderContent()}
      </div>
    </div>
  );
};

export default PurchasePanel;