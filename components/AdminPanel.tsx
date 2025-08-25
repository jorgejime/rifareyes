import React, { useState, useMemo } from 'react';
import type { TicketData, RaffleSettings } from '../types';

interface AdminPanelProps {
  tickets: TicketData;
  onMarkAsSold: (number: string) => void;
  onReleaseTicket: (number: string) => void;
  onClose: () => void;
  raffleSettings: RaffleSettings;
  onUpdateRaffleSettings: (settings: RaffleSettings) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ tickets, onMarkAsSold, onReleaseTicket, onClose, raffleSettings, onUpdateRaffleSettings }) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'search' | 'pending' | 'sold' | 'settings'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSettings, setTempSettings] = useState<RaffleSettings>(raffleSettings);

  // Get all tickets by status
  const pendingTickets = useMemo(() => 
    Object.entries(tickets)
      .filter(([_, ticket]) => ticket.status === 'pending')
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
  , [tickets]);

  const soldTickets = useMemo(() => 
    Object.entries(tickets)
      .filter(([_, ticket]) => ticket.status === 'sold')
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
  , [tickets]);

  // Group tickets by customer
  const customerGroups = useMemo(() => {
    const groups = new Map<string, {
      customer: any;
      numbers: Array<{ number: string; ticket: any; status: string }>;
    }>();

    Object.entries(tickets).forEach(([number, ticket]) => {
      if (ticket.owner && (ticket.status === 'pending' || ticket.status === 'sold')) {
        const customerId = `${ticket.owner.name}-${ticket.owner.whatsapp}`;
        
        if (!groups.has(customerId)) {
          groups.set(customerId, {
            customer: ticket.owner,
            numbers: []
          });
        }
        
        groups.get(customerId)!.numbers.push({
          number,
          ticket,
          status: ticket.status
        });
      }
    });

    // Sort numbers within each group and convert to array
    const sortedGroups = Array.from(groups.values()).map(group => ({
      ...group,
      numbers: group.numbers.sort((a, b) => parseInt(a.number) - parseInt(b.number))
    }));

    // Sort groups by customer name
    return sortedGroups.sort((a, b) => a.customer.name.localeCompare(b.customer.name));
  }, [tickets]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const searchNumbers = searchQuery
      .split(/[,\s\-]+/)
      .map(num => num.trim().padStart(2, '0'))
      .filter(num => num.length <= 2 && /^\d+$/.test(num));

    return searchNumbers.map(num => ({
      number: num,
      ticket: tickets[num] || { status: 'available' as const }
    }));
  }, [searchQuery, tickets]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const TicketCard = ({ number, ticket, showActions = false }: any) => {
    const getStatusColor = () => {
      switch (ticket.status) {
        case 'sold': return 'border-green-500 bg-green-900/20';
        case 'pending': return 'border-amber-500 bg-amber-900/20';
        default: return 'border-slate-500 bg-slate-900/20';
      }
    };

    const getStatusText = () => {
      switch (ticket.status) {
        case 'sold': return 'Vendido';
        case 'pending': return 'Pendiente';
        default: return 'Disponible';
      }
    };

    return (
      <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-white">#{number}</span>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            ticket.status === 'sold' ? 'bg-green-600 text-white' :
            ticket.status === 'pending' ? 'bg-amber-600 text-white' :
            'bg-slate-600 text-white'
          }`}>
            {getStatusText()}
          </span>
        </div>

        {ticket.owner ? (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-slate-400">Cliente:</span>
              <span className="ml-2 text-white font-medium">{ticket.owner.name}</span>
            </div>
            <div>
              <span className="text-slate-400">WhatsApp:</span>
              <span className="ml-2 text-white">{ticket.owner.whatsapp}</span>
            </div>
            <div>
              <span className="text-slate-400">Fecha:</span>
              <span className="ml-2 text-white">{formatDate(ticket.reservationTimestamp)}</span>
            </div>
            <div>
              <span className="text-slate-400">Monto:</span>
              <span className="ml-2 text-yellow-400 font-bold">${raffleSettings.ticketPrice.toLocaleString('es-CO')}</span>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-sm">
            {ticket.status === 'available' ? 
              `Número disponible - $${raffleSettings.ticketPrice.toLocaleString('es-CO')}` : 
              'Sin información'
            }
          </div>
        )}

        {showActions && ticket.status === 'pending' && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onMarkAsSold(number)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
            >
              ✓ Confirmar Pago
            </button>
            <button
              onClick={() => onReleaseTicket(number)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
            >
              ✗ Liberar
            </button>
          </div>
        )}
      </div>
    );
  };

  const CustomerGroup = ({ group }: { group: any }) => {
    const pendingNumbers = group.numbers.filter((n: any) => n.status === 'pending');
    const soldNumbers = group.numbers.filter((n: any) => n.status === 'sold');
    const totalAmount = group.numbers.length * raffleSettings.ticketPrice;
    
    const confirmAllPending = () => {
      pendingNumbers.forEach((n: any) => onMarkAsSold(n.number));
    };
    
    const releaseAllPending = () => {
      pendingNumbers.forEach((n: any) => onReleaseTicket(n.number));
    };

    return (
      <div className="border border-slate-600 rounded-lg p-6 bg-slate-900/30">
        {/* Customer Info */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-white">{group.customer.name}</h3>
              <p className="text-slate-400">WhatsApp: {group.customer.whatsapp}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">${totalAmount.toLocaleString('es-CO')}</div>
              <div className="text-sm text-slate-400">{group.numbers.length} números</div>
            </div>
          </div>
        </div>

        {/* Numbers */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {group.numbers.map((n: any) => (
              <span
                key={n.number}
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  n.status === 'sold' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-amber-600 text-white animate-pulse'
                }`}
              >
                #{n.number}
              </span>
            ))}
          </div>
          
          <div className="flex gap-4 text-sm">
            {soldNumbers.length > 0 && (
              <div className="text-green-400">
                ✓ {soldNumbers.length} vendidos
              </div>
            )}
            {pendingNumbers.length > 0 && (
              <div className="text-amber-400">
                ⏳ {pendingNumbers.length} pendientes
              </div>
            )}
          </div>
        </div>

        {/* Actions for pending numbers */}
        {pendingNumbers.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={confirmAllPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              ✓ Confirmar todos los pendientes ({pendingNumbers.length})
            </button>
            <button
              onClick={releaseAllPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              ✗ Liberar todos los pendientes
            </button>
          </div>
        )}

        {pendingNumbers.length === 0 && soldNumbers.length > 0 && (
          <div className="text-center py-2 text-green-400 font-medium">
            ✅ Todos los números confirmados
          </div>
        )}
      </div>
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setTempSettings(prev => ({ ...prev, prizeImageUrl: imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    onUpdateRaffleSettings(tempSettings);
    alert('Configuración guardada exitosamente');
  };

  const handleResetSettings = () => {
    setTempSettings(raffleSettings);
  };

  const tabs = [
    { id: 'customers', label: `Clientes (${customerGroups.length})`, color: 'text-blue-400 border-blue-400' },
    { id: 'pending', label: `Pendientes (${pendingTickets.length})`, color: 'text-amber-400 border-amber-400' },
    { id: 'sold', label: `Vendidos (${soldTickets.length})`, color: 'text-green-400 border-green-400' },
    { id: 'search', label: 'Buscar', color: 'text-teal-400 border-teal-400' },
    { id: 'settings', label: 'Configuración', color: 'text-purple-400 border-purple-400' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-teal-500/40 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Panel de Administrador</h1>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{soldTickets.length}</div>
              <div className="text-sm text-green-300">Vendidos</div>
            </div>
            <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{pendingTickets.length}</div>
              <div className="text-sm text-amber-300">Pendientes</div>
            </div>
            <div className="bg-teal-900/30 border border-teal-500/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-teal-400">${(soldTickets.length * raffleSettings.ticketPrice).toLocaleString('es-CO')}</div>
              <div className="text-sm text-teal-300">Ingresos</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex space-x-1 border-b border-slate-700/50">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? tab.color 
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'customers' && (
            <div>
              {customerGroups.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-blue-400 mb-2">Gestión por Cliente</h3>
                    <p className="text-slate-400">Aquí puedes ver y gestionar todos los números de cada cliente agrupados.</p>
                  </div>
                  <div className="space-y-4">
                    {customerGroups.map((group, index) => (
                      <CustomerGroup key={`${group.customer.cedula}-${index}`} group={group} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <div className="text-xl">No hay clientes aún</div>
                  <div>Los clientes con números comprados aparecerán aquí</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div>
              <div className="mb-6">
                <label className="block text-sm text-slate-300 mb-2">
                  Buscar números (separados por comas o espacios):
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="1, 5, 15, 23..."
                  className="w-full bg-slate-900/70 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
                />
              </div>
              
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map(({ number, ticket }) => (
                    <TicketCard key={number} number={number} ticket={ticket} showActions={true} />
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="text-center text-slate-400 py-12">
                  Ingresa números para buscar
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'pending' && (
            <div>
              {pendingTickets.length > 0 ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-amber-400">Números Pendientes de Confirmación</h3>
                    {pendingTickets.length > 1 && (
                      <div className="text-sm text-slate-400">
                        {pendingTickets.length} números esperando confirmación
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingTickets.map(([number, ticket]) => (
                      <TicketCard key={number} number={number} ticket={ticket} showActions={true} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <div className="text-xl">¡Excelente!</div>
                  <div>No hay números pendientes de confirmación</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sold' && (
            <div>
              {soldTickets.length > 0 ? (
                <>
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-green-400">Números Vendidos</h3>
                    <p className="text-sm text-slate-400">{soldTickets.length} números confirmados</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {soldTickets.map(([number, ticket]) => (
                      <TicketCard key={number} number={number} ticket={ticket} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 py-12">
                  <div className="text-6xl mb-4">🎫</div>
                  <div className="text-xl">Aún no hay ventas</div>
                  <div>Los números vendidos aparecerán aquí</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-purple-400 mb-2">Configuración de la Rifa</h3>
                <p className="text-slate-400">Personaliza la información de tu rifa y premio.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nombre de la Rifa
                    </label>
                    <input
                      type="text"
                      value={tempSettings.raffleName}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, raffleName: e.target.value }))}
                      className="w-full bg-slate-900/70 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                      placeholder="Ej: Gran Rifa SAMMY"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nombre del Premio
                    </label>
                    <input
                      type="text"
                      value={tempSettings.prizeName}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, prizeName: e.target.value }))}
                      className="w-full bg-slate-900/70 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                      placeholder="Ej: Motocicleta Honda CB 190R"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Valor del Premio
                    </label>
                    <input
                      type="text"
                      value={tempSettings.prizeValue}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, prizeValue: e.target.value }))}
                      className="w-full bg-slate-900/70 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                      placeholder="Ej: $5,000,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Precio del Número
                    </label>
                    <input
                      type="number"
                      value={tempSettings.ticketPrice}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, ticketPrice: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-slate-900/70 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                      placeholder="20000"
                      min="1000"
                      step="1000"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Precio en pesos colombianos (mínimo: $1,000)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nombre del Sorteo
                    </label>
                    <input
                      type="text"
                      value={tempSettings.lotteryName}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, lotteryName: e.target.value }))}
                      className="w-full bg-slate-900/70 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                      placeholder="Ej: Sinuano Noche, Culona Día, Dorado Mañana"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Sorteo oficial del que se tomarán las dos últimas cifras
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Imagen del Premio
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full bg-slate-900/70 border border-slate-600 rounded-lg p-3 text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Recomendado: Imagen horizontal (16:9 o similar), máximo 2MB
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSaveSettings}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      💾 Guardar Configuración
                    </button>
                    <button
                      onClick={handleResetSettings}
                      className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      ↺ Descartar Cambios
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4">Vista Previa</h4>
                    
                    {/* Header Preview */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 mb-4">
                      <h1 className="text-2xl md:text-3xl font-bold text-center text-teal-400 mb-2">
                        {tempSettings.raffleName || 'Nombre de la Rifa'}
                      </h1>
                      <p className="text-lg md:text-xl text-center text-yellow-400 font-semibold mb-2">
                        {tempSettings.prizeName || 'Nombre del Premio'}
                      </p>
                      <p className="text-xl md:text-2xl text-center text-white font-bold mb-2">
                        {tempSettings.prizeValue || 'Valor del Premio'}
                      </p>
                      <p className="text-slate-300 text-sm text-center">
                        ¡Participa y gana! Jugamos con las dos últimas cifras del sorteo{' '}
                        <span className="font-bold text-yellow-300">
                          {tempSettings.lotteryName || 'Nombre del Sorteo'}
                        </span>.
                      </p>
                    </div>

                    {/* Image Preview */}
                    {tempSettings.prizeImageUrl && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-slate-300 mb-2">Imagen del Premio:</h5>
                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                          <img
                            src={tempSettings.prizeImageUrl}
                            alt="Premio"
                            className="w-full h-32 sm:h-48 md:h-64 object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    {/* Price Preview */}
                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-slate-300 mb-2">Precio por Número:</h5>
                      <p className="text-2xl font-bold text-yellow-400">
                        ${tempSettings.ticketPrice.toLocaleString('es-CO')} COP
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;