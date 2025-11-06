import { supabase } from '../lib/supabase';
import type { RaffleSettings, TicketData, RaffleTicket, UserInfo, TicketStatus } from '../types';

export class RaffleService {
  // Configuración de la rifa
  static async getRaffleSettings(): Promise<RaffleSettings> {
    // Verificar si Supabase está configurado
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase no configurado, usando datos por defecto');
      return {
        raffleName: 'Gran Rifa SAMMY',
        prizeName: 'Premio Especial',
        prizeValue: '$5,000,000',
        ticketPrice: 20000,
        prizeImageUrl: '',
        lotteryName: 'Sinuano Noche'
      };
    }

    const { data, error } = await supabase
      .from('raffle_settings')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error al obtener configuración:', error);
      // Retornar configuración por defecto si hay error
      return {
        raffleName: 'Gran Rifa SAMMY',
        prizeName: 'Premio Especial',
        prizeValue: '$5,000,000',
        ticketPrice: 20000,
        prizeImageUrl: '',
        lotteryName: 'Sinuano Noche'
      };
    }

    if (!data) {
      // No hay configuración guardada, retornar valores por defecto
      return {
        raffleName: 'Gran Rifa SAMMY',
        prizeName: 'Premio Especial',
        prizeValue: '$5,000,000',
        ticketPrice: 20000,
        prizeImageUrl: '',
        lotteryName: 'Sinuano Noche'
      };
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
    // Verificar si Supabase está configurado
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase no configurado, cambios no se guardarán');
      throw new Error('Supabase no está configurado. Los cambios no se pueden guardar.');
    }

    // Primero obtener el ID de la configuración existente
    const { data: existingData, error: selectError } = await supabase
      .from('raffle_settings')
      .select('id')
      .maybeSingle();

    if (selectError) {
      console.error('Error al obtener ID de configuración:', selectError);
      throw new Error('No se pudo verificar la configuración existente');
    }

    if (!existingData) {
      // No existe, crear una nueva entrada
      const { error: insertError } = await supabase
        .from('raffle_settings')
        .insert({
          raffle_name: settings.raffleName,
          prize_name: settings.prizeName,
          prize_value: settings.prizeValue,
          ticket_price: settings.ticketPrice,
          prize_image_url: settings.prizeImageUrl,
          lottery_name: settings.lotteryName
        });

      if (insertError) {
        console.error('Error al crear configuración:', insertError);
        throw new Error('No se pudo crear la configuración');
      }
      return;
    }

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
      .eq('id', existingData.id);

    if (error) {
      console.error('Error al actualizar configuración:', error);
      throw new Error('No se pudo actualizar la configuración');
    }
  }

  // Gestión de tickets
  static async getAllTickets(): Promise<TicketData> {
    // Verificar si Supabase está configurado
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase no configurado, generando tickets por defecto');
      // Generar tickets por defecto del 00 al 99
      const defaultTickets: TicketData = {};
      for (let i = 0; i <= 99; i++) {
        const number = i.toString().padStart(2, '0');
        defaultTickets[number] = { status: 'available' };
      }
      return defaultTickets;
    }

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('number');

    if (error) {
      console.error('Error al obtener tickets:', error);
      // Generar tickets por defecto si hay error
      const defaultTickets: TicketData = {};
      for (let i = 0; i <= 99; i++) {
        const number = i.toString().padStart(2, '0');
        defaultTickets[number] = { status: 'available' };
      }
      return defaultTickets;
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
    // Verificar si Supabase está configurado
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Supabase no está configurado. No se pueden reservar números.');
    }

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
    // Verificar si Supabase está configurado
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Supabase no está configurado. No se puede actualizar el estado.');
    }

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
    // Verificar si Supabase está configurado
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return [];
    }

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
    // Verificar si Supabase está configurado
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return () => {}; // Retornar función vacía
    }

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
    // Verificar si Supabase está configurado
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return () => {}; // Retornar función vacía
    }

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