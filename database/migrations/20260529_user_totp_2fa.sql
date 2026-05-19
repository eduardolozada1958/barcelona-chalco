-- Autenticación en dos pasos (TOTP / Google Authenticator) — opcional por usuario.
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS totp_secret_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS totp_enabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS totp_backup_codes_hashes JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.users.totp_secret_encrypted IS 'Secreto TOTP cifrado (AES); null si 2FA desactivado';
COMMENT ON COLUMN public.users.totp_enabled IS 'true cuando el usuario confirmó el código en la app autenticadora';
COMMENT ON COLUMN public.users.totp_backup_codes_hashes IS 'Array JSON de hashes bcrypt de códigos de respaldo';
