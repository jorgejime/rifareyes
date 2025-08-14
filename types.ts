export type TicketStatus = 'available' | 'pending' | 'sold';

export interface UserInfo {
  name: string;
  cedula: string;
  whatsapp: string;
}

export interface RaffleTicket {
  status: TicketStatus;
  owner?: UserInfo; 
  reservationTimestamp?: number; // Unix timestamp (ms)
}

export type TicketData = Record<string, RaffleTicket>;