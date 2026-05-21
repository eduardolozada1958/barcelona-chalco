-- Sesión Baileys en Supabase (Render Free sin disco persistente).
CREATE TABLE IF NOT EXISTS public.whatsapp_auth_files (
  file_name  TEXT PRIMARY KEY,
  content    TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.whatsapp_auth_files IS 'Copia de creds.json y claves Signal de Baileys; solo backend (service role).';

ALTER TABLE public.whatsapp_auth_files ENABLE ROW LEVEL SECURITY;
