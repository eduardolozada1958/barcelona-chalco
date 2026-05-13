import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Cliente estándar (usa anon key - respeta RLS)
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Cliente de servicio (usa service role key - bypassa RLS)
// SOLO para operaciones de backend que requieren acceso completo
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
