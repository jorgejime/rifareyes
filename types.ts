export type TicketStatus = 'available' | 'pending' | 'sold';

export interface UserInfo {
  name: string;
  whatsapp: string;
}

export interface RaffleTicket {
  status: TicketStatus;
  owner?: UserInfo; 
  reservationTimestamp?: number; // Unix timestamp (ms)
}

export interface RaffleSettings {
  raffleName: string;
  prizeName: string;
  prizeValue: string;
  ticketPrice: number;
  prizeImageUrl?: string;
  lotteryName: string;
}

export type TicketData = Record<string, RaffleTicket>;