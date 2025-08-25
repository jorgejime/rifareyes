export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      raffle_settings: {
        Row: {
          id: string
          raffle_name: string
          prize_name: string
          prize_value: string
          ticket_price: number
          prize_image_url: string | null
          lottery_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          raffle_name?: string
          prize_name?: string
          prize_value?: string
          ticket_price?: number
          prize_image_url?: string | null
          lottery_name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          raffle_name?: string
          prize_name?: string
          prize_value?: string
          ticket_price?: number
          prize_image_url?: string | null
          lottery_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          number: string
          status: 'available' | 'pending' | 'sold'
          owner_name: string | null
          owner_whatsapp: string | null
          reservation_timestamp: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          number: string
          status?: 'available' | 'pending' | 'sold'
          owner_name?: string | null
          owner_whatsapp?: string | null
          reservation_timestamp?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          number?: string
          status?: 'available' | 'pending' | 'sold'
          owner_name?: string | null
          owner_whatsapp?: string | null
          reservation_timestamp?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ticket_status: 'available' | 'pending' | 'sold'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}