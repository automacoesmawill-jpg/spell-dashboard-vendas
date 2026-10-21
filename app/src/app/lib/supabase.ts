// Importa função de criação de cliente do pacote server do Supabase
import { createClient } from '@supabase/supabase-js';

// Lê variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente para uso no browser (leitura pública)
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);

// Cliente para uso no servidor (escrita/admin)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
