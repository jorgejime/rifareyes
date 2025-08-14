import React from 'react';
import type { TicketData, TicketStatus } from '../types';

interface NumberSelectorProps {
  tickets: TicketData;
  selectedNumbers: string[];
  onSelectNumber: (number: string) => void;
  isAdmin: boolean;
  viewingNumber: string | null;
}

const NumberButton: React.FC<{
  num: string;
  status: TicketStatus;
  isSelected: boolean;
  isViewing: boolean;
  onClick: () => void;
  disabled: boolean;
}> = ({ num, status, isSelected, isViewing, onClick, disabled }) => {
  
  const getStatusClasses = () => {
    if (isViewing) {
       return 'scale-110 ring-4 ring-offset-2 ring-cyan-400 ring-offset-slate-900 z-10';
    }
    if (isSelected) {
      return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900 font-extrabold scale-110 shadow-lg shadow-yellow-500/50';
    }
    switch (status) {
      case 'sold':
        return 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-70';
      case 'pending':
        return 'bg-amber-600 text-white animate-pulse';
      case 'available':
      default:
        return 'bg-slate-700 text-slate-300 hover:bg-teal-600 hover:text-white hover:shadow-lg hover:shadow-teal-500/50';
    }
  };

  const statusText = {
      sold: 'Vendido',
      pending: 'Pendiente',
      available: num
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        aspect-square flex items-center justify-center text-sm md:text-base font-bold rounded-lg transition-all duration-200 relative
        ${getStatusClasses()}
        ${!disabled ? 'transform hover:scale-110 hover:z-10' : ''}
      `}
      aria-label={`Número ${num}, estado: ${status}`}
    >
      <span className="truncate">{status === 'available' ? num : statusText[status]}</span>
    </button>
  );
};


const NumberSelector: React.FC<NumberSelectorProps> = ({ tickets, selectedNumbers, onSelectNumber, isAdmin, viewingNumber }) => {
  const numbers = Object.keys(tickets).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  return (
    <div className="w-full max-w-md mx-auto">
        <div className="grid grid-cols-10 gap-2 p-4 bg-slate-800/50 rounded-lg border border-teal-500/30 shadow-lg">
        {numbers.map((num) => {
            const ticket = tickets[num];
            const isSelected = selectedNumbers.includes(num);
            const isViewing = viewingNumber === num;
            // A number is disabled if it's sold, or if it's pending and admin is not active.
            // Admin can click pending numbers to manage them.
            const isDisabled = ticket.status === 'sold' || (ticket.status === 'pending' && !isAdmin);
            
            return (
              <NumberButton
                key={num}
                num={num}
                status={ticket.status}
                isSelected={isSelected}
                isViewing={isViewing}
                onClick={() => onSelectNumber(num)}
                disabled={isDisabled}
              />
            );
        })}
        </div>
    </div>
  );
};

export default NumberSelector;