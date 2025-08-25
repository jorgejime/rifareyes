import { supabase } from '../lib/supabase';
import type { RaffleSettings, TicketData, RaffleTicket, UserInfo, TicketStatus } from '../types';

export class RaffleService {
  // Configuración de la rifa
  static async getRaffleSettings(): Promise<RaffleSettings> {
    const { data, error } = await supabase
      .from('raffle_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error al obtener configuración:', error);
      throw new Error('No se pudo cargar la configuración de la rifa');
    }

    return {
      raffleName: data.raffle_name,
      prizeName: data.prize_name,
      prizeValue: data.prize_value,
      ticketPrice: data.ticket_price,
      prizeImageUrl: data.prize_image_url || '',
      lotteryName: data.lottery_name
    };
  }

  static async updateRaffleSettings(settings: RaffleSettings): Promise<void> {
    const { error } = await supabase
      .from('raffle_settings')
      .update({
        raffle_name: settings.raffleName,
        prize_name: settings.prizeName,
        prize_value: settings.prizeValue,
        ticket_price: settings.ticketPrice,
        prize_image_url: settings.prizeImageUrl,
        lottery_name: settings.lotteryName
      })
      .eq('id', (await supabase.from('raffle_settings').select('id').single()).data?.id);

    if (error) {
      console.error('Error al actualizar configuración:', error);
      throw new Error('No se pudo actualizar la configuración');
    }
  }

  // Gestión de tickets
  static async getAllTickets(): Promise<TicketData> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('number');

    if (error) {
      console.error('Error al obtener tickets:', error);
      throw new Error('No se pudieron cargar los tickets');
    }

    const ticketData: TicketData = {};
    data.forEach(ticket => {
      ticketData[ticket.number] = {
        status: ticket.status as TicketStatus,
        owner: ticket.owner_name && ticket.owner_whatsapp ? {
          name: ticket.owner_name,
          whatsapp: ticket.owner_whatsapp
        } : undefined,
        reservationTimestamp: ticket.reservation_timestamp ? 
          new Date(ticket.reservation_timestamp).getTime() : undefined
      };
    });

    return ticketData;
  }

  static async reserveTickets(numbers: string[], userInfo: UserInfo): Promise<void> {
    const reservationTime = new Date().toISOString();
    
    const updates = numbers.map(number => ({
      number,
      status: 'pending' as const,
      owner_name: userInfo.name,
      owner_whatsapp: userInfo.whatsapp,
      reservation_timestamp: reservationTime
    }));

    const { error } = await supabase
      .from('tickets')
      .upsert(updates, { onConflict: 'number' });

    if (error) {
      console.error('Error al reservar tickets:', error);
      throw new Error('No se pudieron reservar los números');
    }
  }

  static async updateTicketStatus(numbers: string[], status: TicketStatus): Promise<void> {
    const updates: any = { status };
    
    if (status === 'available') {
      updates.owner_name = null;
      updates.owner_whatsapp = null;
      updates.reservation_timestamp = null;
    } else if (status === 'sold') {
      updates.reservation_timestamp = null;
    }

    const { error } = await supabase
      .from('tickets')
      .update(updates)
      .in('number', numbers);

    if (error) {
      console.error('Error al actualizar estado de tickets:', error);
      throw new Error('No se pudo actualizar el estado de los números');
    }
  }

  static async releaseExpiredTickets(): Promise<string[]> {
    const expirationTime = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    // Primero obtener los tickets expirados
    const { data: expiredTickets, error: selectError } = await supabase
      .from('tickets')
      .select('number')
      .eq('status', 'pending')
      .lt('reservation_timestamp', expirationTime);

    if (selectError) {
      console.error('Error al buscar tickets expirados:', selectError);
      return [];
    }

    if (!expiredTickets || expiredTickets.length === 0) {
      return [];
    }

    // Liberar los tickets expirados
    const expiredNumbers = expiredTickets.map(t => t.number);
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'available',
        owner_name: null,
        owner_whatsapp: null,
        reservation_timestamp: null
      })
      .in('number', expiredNumbers);

    if (updateError) {
      console.error('Error al liberar tickets expirados:', updateError);
      return [];
    }

    console.log(`Liberados ${expiredNumbers.length} tickets expirados:`, expiredNumbers);
    return expiredNumbers;
  }

  // Suscripción a cambios en tiempo real
  static subscribeToTicketChanges(callback: (tickets: TicketData) => void) {
    const subscription = supabase
      .channel('tickets-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' },
        async () => {
          try {
            const tickets = await this.getAllTickets();
            callback(tickets);
          } catch (error) {
            console.error('Error al actualizar tickets en tiempo real:', error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  static subscribeToSettingsChanges(callback: (settings: RaffleSettings) => void) {
    const subscription = supabase
      .channel('settings-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'raffle_settings' },
        async () => {
          try {
            const settings = await this.getRaffleSettings();
            callback(settings);
          } catch (error) {
            console.error('Error al actualizar configuración en tiempo real:', error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}