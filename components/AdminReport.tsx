import React, { useState, useMemo } from 'react';
import type { TicketData } from '../types';

interface AdminReportProps {
  tickets: TicketData;
  onClose: () => void;
  onMarkAsSold: (number: string) => void;
  onReleaseTicket: (number: string) => void;
}

const AdminReport: React.FC<AdminReportProps> = ({ tickets, onClose, onMarkAsSold, onReleaseTicket }) => {
  const [searchNumbers, setSearchNumbers] = useState<string>('');

  // Parse search numbers - support comma, space, or dash separated
  const searchNumbersArray = useMemo(() => {
    if (!searchNumbers.trim()) return [];
    return searchNumbers
      .split(/[,\s\-]+/)
      .map(num => num.trim().padStart(2, '0'))
      .filter(num => num.length > 0 && /^\d{1,2}$/.test(num));
  }, [searchNumbers]);

  const soldTickets = Object.entries(tickets)
    .filter(([_, ticket]) => ticket.status === 'sold')
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  const pendingTickets = Object.entries(tickets)
    .filter(([_, ticket]) => ticket.status === 'pending')
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  // Filter tickets based on search
  const filteredTickets = useMemo(() => {
    if (searchNumbersArray.length === 0) return [];
    
    return searchNumbersArray.map(num => {
      const ticket = tickets[num];
      if (!ticket || ticket.status === 'available') {
        return {
          number: num,
          status: 'available' as const,
          data: null
        };
      }
      return {
        number: num,
        status: ticket.status,
        data: ticket
      };
    });
  }, [searchNumbersArray, tickets]);

  const totalSold = soldTickets.length;
  const totalPending = pendingTickets.length;
  const totalRevenue = totalSold * 20000;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('es-CO');
  };

  const SearchResult: React.FC<{ result: any }> = ({ result }) => {
    const { number, status, data } = result;
    const amount = status === 'available' ? 0 : 20000;
    
    const getStatusInfo = () => {
      switch (status) {
        case 'sold':
          return { text: 'Vendido', class: 'bg-green-600 text-white' };
        case 'pending':
          return { text: 'Pendiente', class: 'bg-amber-600 text-white' };
        case 'available':
        default:
          return { text: 'Disponible', class: 'bg-slate-600 text-white' };
      }
    };
    
    const statusInfo = getStatusInfo();
    
    return (
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-bold text-white">Número {number}</div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.class}`}>
            {statusInfo.text}
          </span>
        </div>
        
        {data && data.owner ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-400">Comprador:</span>
              <div className="text-white font-medium">{data.owner.name}</div>
            </div>
            <div>
              <span className="text-slate-400">Cédula:</span>
              <div className="text-white font-medium">{data.owner.cedula}</div>
            </div>
            <div>
              <span className="text-slate-400">WhatsApp:</span>
              <div className="text-white font-medium">{data.owner.whatsapp}</div>
            </div>
            <div>
              <span className="text-slate-400">Fecha:</span>
              <div className="text-white font-medium">{formatDate(data.reservationTimestamp)}</div>
            </div>
            <div>
              <span className="text-slate-400">Monto:</span>
              <div className="text-yellow-400 font-bold">${amount.toLocaleString('es-CO')} COP</div>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-sm">
            {status === 'available' ? 'Este número está disponible para compra.' : 'Sin información del comprador.'}
            {status === 'available' && (
              <div className="mt-2">
                <span className="text-slate-400">Precio:</span>
                <span className="text-yellow-400 font-bold ml-2">${(20000).toLocaleString('es-CO')} COP</span>
              </div>
            )}
          </div>
        )}
        
        {status === 'pending' && (
          <div className="mt-4 flex gap-2">
            <button 
              onClick={() => onMarkAsSold(number)}
              className="flex-1 py-2 px-4 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-500 transition-colors text-sm"
            >
              ✓ Confirmar Pago
            </button>
            <button 
              onClick={() => onReleaseTicket(number)}
              className="flex-1 py-2 px-4 bg-red-700 text-white font-bold rounded-lg shadow-lg hover:bg-red-600 transition-colors text-sm"
            >
              ✗ Liberar
            </button>
          </div>
        )}
      </div>
    );
  };

  const TicketRow: React.FC<{ number: string; ticket: any; status: 'sold' | 'pending' }> = ({ number, ticket, status }) => (
    <tr className={`border-b border-slate-700/50 ${status === 'sold' ? 'bg-green-900/20' : 'bg-amber-900/20'}`}>
      <td className="px-3 py-2 text-center font-bold text-white text-lg">{number}</td>
      <td className="px-3 py-2 text-slate-200">{ticket.owner?.name || 'N/A'}</td>
      <td className="px-3 py-2 text-slate-300">{ticket.owner?.cedula || 'N/A'}</td>
      <td className="px-3 py-2 text-slate-300">{ticket.owner?.whatsapp || 'N/A'}</td>
      <td className="px-3 py-2 text-slate-400 text-sm">{formatDate(ticket.reservationTimestamp)}</td>
      <td className="px-3 py-2 text-center">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          status === 'sold' 
            ? 'bg-green-600 text-white' 
            : 'bg-amber-600 text-white'
        }`}>
          {status === 'sold' ? 'Vendido' : 'Pendiente'}
        </span>
      </td>
    </tr>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-teal-500/40 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Reporte de Administrador</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors text-2xl"
              aria-label="Cerrar reporte"
            >
              ✕
            </button>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm text-slate-300 mb-2">
              Buscar números específicos (separados por comas, espacios o guiones):
            </label>
            <input
              type="text"
              value={searchNumbers}
              onChange={(e) => setSearchNumbers(e.target.value)}
              placeholder="Ej: 01, 15, 23-25, 30 45"
              className="w-full bg-slate-900/70 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
            />
            {searchNumbers.trim() && (
              <div className="mt-2 text-xs text-slate-400">
                Buscando: {searchNumbersArray.join(', ') || 'Formato inválido'}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{totalSold}</div>
              <div className="text-sm text-green-300">Números Vendidos</div>
            </div>
            <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{totalPending}</div>
              <div className="text-sm text-amber-300">Números Pendientes</div>
            </div>
            <div className="bg-teal-900/30 border border-teal-500/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-teal-400">${totalRevenue.toLocaleString('es-CO')}</div>
              <div className="text-sm text-teal-300">Ingresos Confirmados</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {filteredTickets.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-teal-400 mb-4">
                Resultados de búsqueda ({filteredTickets.length} números)
              </h3>
              <div className="space-y-3">
                {filteredTickets.map((result) => (
                  <SearchResult key={result.number} result={result} />
                ))}
              </div>
            </div>
          )}

          {!searchNumbers.trim() && soldTickets.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-green-400 mb-4">Números Vendidos ({totalSold})</h3>
              <div className="overflow-x-auto">
                <table className="w-full bg-slate-900/50 rounded-lg overflow-hidden">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-slate-200">Número</th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-slate-200">Nombre</th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-slate-200">Cédula</th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-slate-200">WhatsApp</th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-slate-200">Fecha</th>
                      <th className="px-3 py-3 text-center text-sm font-semibold text-slate-200">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soldTickets.map(([number, ticket]) => (
                      <TicketRow key={number} number={number} ticket={ticket} status="sold" />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!searchNumbers.trim() && pendingTickets.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4">Números Pendientes de Pago ({totalPending})</h3>
              <div className="overflow-x-auto">
                <table className="w-full bg-slate-900/50 rounded-lg overflow-hidden">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-slate-200">Número</th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-slate-200">Nombre</th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-slate-200">Cédula</th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-slate-200">WhatsApp</th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-slate-200">Reservado</th>
                      <th className="px-3 py-3 text-center text-sm font-semibold text-slate-200">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTickets.map(([number, ticket]) => (
                      <TicketRow key={number} number={number} ticket={ticket} status="pending" />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!searchNumbers.trim() && soldTickets.length === 0 && pendingTickets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No hay números vendidos o pendientes aún.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReport;