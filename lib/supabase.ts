import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Variables de entorno de Supabase no configuradas. Usando modo local.');
  // Crear un cliente mock para desarrollo local
  supabase = {
    from: () => ({
      select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase no configurado') }) }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase no configurado') }),
      update: () => Promise.resolve({ data: null, error: new Error('Supabase no configurado') }),
      upsert: () => Promise.resolve({ data: null, error: new Error('Supabase no configurado') }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
    })
  };
} else {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export { supabase };