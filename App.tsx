import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { TicketData, RaffleTicket, TicketStatus, UserInfo, RaffleSettings } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import NumberSelector from './components/NumberSelector';
import PurchasePanel from './components/ResultPanel';
import AdminPanel from './components/AdminPanel';

const APP_STORAGE_KEY = 'raffle-tickets-storage';
const RAFFLE_SETTINGS_KEY = 'raffle-settings-storage';
const RESERVATION_EXPIRATION_MINUTES = 30;

const defaultRaffleSettings: RaffleSettings = {
  raffleName: 'Gran Rifa SAMMY',
  prizeName: 'Premio Especial',
  prizeValue: '$5,000,000',
  ticketPrice: 20000,
  prizeImageUrl: '',
  lotteryName: 'Sinuano Noche'
};

const initializeTickets = (): TicketData => {
  return Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'))
    .reduce((acc, num) => {
      acc[num] = { status: 'available' };
      return acc;
    }, {} as TicketData);
};

const App: React.FC = () => {
  const [tickets, setTickets] = useState<TicketData>({});
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [viewingNumber, setViewingNumber] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', whatsapp: '' });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [raffleSettings, setRaffleSettings] = useState<RaffleSettings>(defaultRaffleSettings);

  const checkExpiredTickets = useCallback((currentTickets: TicketData): TicketData => {
    const now = Date.now();
    const expirationMs = RESERVATION_EXPIRATION_MINUTES * 60 * 1000;
    const updatedTickets = { ...currentTickets };
    let changed = false;

    Object.keys(updatedTickets).forEach(num => {
      const ticket = updatedTickets[num];
      if (ticket.status === 'pending' && ticket.reservationTimestamp) {
        if (now - ticket.reservationTimestamp > expirationMs) {
          console.log(`Ticket ${num} expired. Releasing.`);
          updatedTickets[num] = { status: 'available' };
          changed = true;
        }
      }
    });

    return changed ? updatedTickets : currentTickets;
  }, []);

  useEffect(() => {
    try {
      const savedTicketsJSON = localStorage.getItem(APP_STORAGE_KEY);
      const initialTickets = savedTicketsJSON ? JSON.parse(savedTicketsJSON) : initializeTickets();
      const validTickets = checkExpiredTickets(initialTickets);
      setTickets(validTickets);

      // Load raffle settings
      const savedSettingsJSON = localStorage.getItem(RAFFLE_SETTINGS_KEY);
      const initialSettings = savedSettingsJSON ? JSON.parse(savedSettingsJSON) : defaultRaffleSettings;
      setRaffleSettings(initialSettings);

    } catch (error) {
      console.error("Failed to load data from localStorage, resetting.", error);
      setTickets(initializeTickets());
      setRaffleSettings(defaultRaffleSettings);
    } finally {
        setIsInitialized(true);
    }
  }, [checkExpiredTickets]);
  
  useEffect(() => {
    if (isInitialized) {
        try {
            localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(tickets));
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
        }
    }
  }, [tickets, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
        try {
            localStorage.setItem(RAFFLE_SETTINGS_KEY, JSON.stringify(raffleSettings));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }
  }, [raffleSettings, isInitialized]);

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


  const handleConfirmPurchase = useCallback(() => {
    if (selectedNumbers.length > 0) {
      const reservationDetails = {
          owner: userInfo,
          reservationTimestamp: Date.now()
      };
      updateTicketStatus(selectedNumbers, 'pending', reservationDetails);
      setShowConfirmation(true);
    }
  }, [selectedNumbers, userInfo]);

  // Update ticket price dynamically
  const updateTicketStatus = useCallback((numbers: string[], newStatus: TicketStatus, details?: Partial<RaffleTicket>) => {
    setTickets(prevTickets => {
        const newTickets = { ...prevTickets };
        numbers.forEach(num => {
            if (newTickets[num]) {
                newTickets[num] = { 
                  ...newTickets[num],
                  status: newStatus,
                  ...details
                };
                if (newStatus === 'available') {
                    delete newTickets[num].owner;
                    delete newTickets[num].reservationTimestamp;
                }
                if (newStatus === 'sold') {
                    delete newTickets[num].reservationTimestamp;
                }
            }
        });
        return newTickets;
    });
  }, []);

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

  const handleUpdateRaffleSettings = useCallback((newSettings: RaffleSettings) => {
    setRaffleSettings(newSettings);
  }, []);

  const viewingTicket = useMemo(() => {
    if (!viewingNumber || !tickets[viewingNumber]) return null;
    return { number: viewingNumber, data: tickets[viewingNumber] };
  }, [viewingNumber, tickets]);


  if (!isInitialized) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
            <p className="text-white text-2xl animate-pulse">Cargando Rifa...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white flex flex-col items-center justify-between p-2 sm:p-4">
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
    </div>
  );
};

export default App;