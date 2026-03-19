import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔗 Conectando a Supabase URL:', supabaseUrl);
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Credenciales de Supabase no encontradas en el archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
