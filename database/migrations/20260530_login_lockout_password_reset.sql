-- Bloqueo por intentos fallidos de login + restablecimiento de contraseña por correo.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS login_locked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.failed_login_attempts IS 'Intentos fallidos consecutivos de contraseña';
COMMENT ON COLUMN public.users.login_locked_at IS 'Bloqueo tras 5 intentos; restablecer con enlace por correo';

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens (expires_at);
