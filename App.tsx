import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { TicketData, RaffleTicket, TicketStatus, UserInfo, RaffleSettings } from './types';
import { RaffleService } from './services/raffleService';
import Header from './components/Header';
import Footer from './components/Footer';
import NumberSelector from './components/NumberSelector';
import PurchasePanel from './components/ResultPanel';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [tickets, setTickets] = useState<TicketData>({});
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [viewingNumber, setViewingNumber] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', whatsapp: '' });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [raffleSettings, setRaffleSettings] = useState<RaffleSettings>({
    raffleName: 'Gran Rifa SAMMY',
    prizeName: 'Premio Especial',
    prizeValue: '$5,000,000',
    ticketPrice: 20000,
    prizeImageUrl: '',
    lotteryName: 'Sinuano Noche'
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar si Supabase está configurado
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setError('Supabase no está configurado. Por favor configura las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
        return;
      }
      
      // Cargar configuración y tickets en paralelo
      const [settings, ticketsData] = await Promise.all([
        RaffleService.getRaffleSettings(),
        RaffleService.getAllTickets()
      ]);
      
      setRaffleSettings(settings);
      setTickets(ticketsData);
      
      // Liberar tickets expirados
      await RaffleService.releaseExpiredTickets();
      
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Suscripciones en tiempo real
  useEffect(() => {
    if (!isInitialized) return;

    // Suscribirse a cambios de tickets
    const unsubscribeTickets = RaffleService.subscribeToTicketChanges((updatedTickets) => {
      setTickets(updatedTickets);
    });

    // Suscribirse a cambios de configuración
    const unsubscribeSettings = RaffleService.subscribeToSettingsChanges((updatedSettings) => {
      setRaffleSettings(updatedSettings);
    });

    return () => {
      unsubscribeTickets();
      unsubscribeSettings();
    };
  }, [isInitialized]);

  // Verificar tickets expirados periódicamente
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(async () => {
      try {
        await RaffleService.releaseExpiredTickets();
      } catch (error) {
        console.error('Error al verificar tickets expirados:', error);
      }
    }, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, [isInitialized]);

  const handleConfirmPurchase = useCallback(async () => {
    if (selectedNumbers.length === 0) return;

    try {
      setLoading(true);
      await RaffleService.reserveTickets(selectedNumbers, userInfo);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error al reservar tickets:', error);
      alert('Error al reservar los números. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [selectedNumbers, userInfo]);

  const updateTicketStatus = useCallback(async (numbers: string[], newStatus: TicketStatus) => {
    try {
      setLoading(true);
      await RaffleService.updateTicketStatus(numbers, newStatus);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Error al actualizar el estado del número. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectNumber = useCallback((number: string) => {
    const ticket = tickets[number];
    if (!ticket) return;
    
    // Admin can always select a ticket to view its details
    if (isAdmin && (ticket.status === 'pending' || ticket.status === 'sold')) {
        setViewingNumber(number);
        setSelectedNumbers([]);
        setShowConfirmation(false);
        return;
    }
    
    if (ticket.status === 'available') {
        setViewingNumber(null);
        setShowConfirmation(false);
        setSelectedNumbers(prev =>
            prev.includes(number)
                ? prev.filter(n => n !== number)
                : [...prev, number]
        );
    } else { // For regular users, clicking a non-available ticket shows details
        setViewingNumber(number);
        setSelectedNumbers([]);
        setShowConfirmation(false);
    }
  }, [tickets, isAdmin]);
  
  const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleResetPurchase = useCallback(() => {
      setSelectedNumbers([]);
      setUserInfo({ name: '', whatsapp: '' });
      setViewingNumber(null);
      setShowConfirmation(false);
  }, []);

  const handleMarkAsSold = useCallback((number?: string) => {
    const targetNumber = number || viewingNumber;
    if (isAdmin && targetNumber && tickets[targetNumber]?.status === 'pending') {
      updateTicketStatus([targetNumber], 'sold');
      if (!number) setViewingNumber(null); // Only clear viewing if called from detail view
    }
  }, [isAdmin, viewingNumber, tickets]);
  
  const handleReleaseTicket = useCallback((number?: string) => {
    const targetNumber = number || viewingNumber;
    if (isAdmin && targetNumber && tickets[targetNumber]?.status === 'pending') {
      updateTicketStatus([targetNumber], 'available');
      if (!number) setViewingNumber(null); // Only clear viewing if called from detail view
    }
  }, [isAdmin, viewingNumber, tickets]);

  const handleAdminModeToggle = useCallback(() => {
    if (isAdmin) {
        setIsAdmin(false);
        setShowAdminPanel(false);
        alert('Modo Administrador Desactivado');
        return;
    }

    const password = prompt('Ingrese la contraseña de administrador:');
    // In a real app, use a secure way to store/check this.
    // For this example, we'll use a simple hardcoded password.
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234'; 
    if (password === ADMIN_PASSWORD) {
        setIsAdmin(true);
        setShowAdminPanel(true); // Auto-open admin panel
    } else {
        alert('Contraseña incorrecta.');
    }
  }, [isAdmin]);

  const handleShowReport = useCallback(() => {
    setShowAdminPanel(true);
  }, []);

  const handleCloseReport = useCallback(() => {
    setShowAdminPanel(false);
  }, []);

  const handleUpdateRaffleSettings = useCallback(async (newSettings: RaffleSettings) => {
    try {
      setLoading(true);
      await RaffleService.updateRaffleSettings(newSettings);
      setRaffleSettings(newSettings);
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      alert('Error al guardar la configuración. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const viewingTicket = useMemo(() => {
    if (!viewingNumber || !tickets[viewingNumber]) return null;
    return { number: viewingNumber, data: tickets[viewingNumber] };
  }, [viewingNumber, tickets]);

  if (loading && !isInitialized) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
            <div className="text-center">
              <p className="text-white text-2xl animate-pulse mb-4">Cargando Rifa...</p>
              <p className="text-slate-400">Conectando con Supabase...</p>
            </div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <p className="text-red-400 text-xl mb-4">Error de Conexión</p>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={loadInitialData}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white flex flex-col items-center justify-between p-2 sm:p-4 ${loading ? 'opacity-75 pointer-events-none' : ''}`}>
      <main className="w-full">
        <Header raffleSettings={raffleSettings} />
        <div className="mt-4 md:mt-8 flex flex-col lg:flex-row lg:items-start lg:justify-center gap-4 md:gap-8 px-2 sm:px-4">
          <div className="flex-shrink-0 lg:w-1/2 max-w-md w-full mx-auto">
            <h2 className="text-xl font-bold text-center text-slate-300 mb-4">1. Elige tu número</h2>
            <NumberSelector
              tickets={tickets}
              selectedNumbers={selectedNumbers}
              onSelectNumber={handleSelectNumber}
              isAdmin={isAdmin}
              viewingNumber={viewingNumber}
            />
          </div>
          <div className="flex-shrink-0 lg:w-1/2 max-w-lg w-full mx-auto mt-4 lg:mt-0">
             <h2 className="text-xl font-bold text-center text-slate-300 mb-4">2. Realiza el pago</h2>
            <PurchasePanel
              selectedNumbers={selectedNumbers}
              userInfo={userInfo}
              onUserInfoChange={handleUserInfoChange}
              onConfirmPurchase={handleConfirmPurchase}
              onResetPurchase={handleResetPurchase}
              viewingTicket={viewingTicket}
              isAdmin={isAdmin}
              onMarkAsSold={handleMarkAsSold}
              onReleaseTicket={handleReleaseTicket}
              showConfirmation={showConfirmation}
              raffleSettings={raffleSettings}
            />
          </div>
        </div>
      </main>
      <Footer 
        onAdminModeToggle={handleAdminModeToggle} 
        isAdmin={isAdmin}
        onShowReport={handleShowReport}
      />
      {showAdminPanel && (
        <AdminPanel 
          tickets={tickets} 
          onClose={handleCloseReport}
          onMarkAsSold={handleMarkAsSold}
          onReleaseTicket={handleReleaseTicket}
          raffleSettings={raffleSettings}
          onUpdateRaffleSettings={handleUpdateRaffleSettings}
        />
      )}
      
      {loading && (
        <div className="fixed top-4 right-4 bg-slate-800 border border-teal-500 rounded-lg p-3 z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400"></div>
            <span className="text-sm text-slate-300">Actualizando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;