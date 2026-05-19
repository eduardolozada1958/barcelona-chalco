-- Cambio de correo de login con confirmación por enlace.

CREATE TABLE IF NOT EXISTS public.email_change_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  new_email  VARCHAR(255) NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_change_tokens_user_id ON public.email_change_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_expires_at ON public.email_change_tokens (expires_at);

COMMENT ON TABLE public.email_change_tokens IS 'Confirmación de cambio de email de login; enlace al nuevo correo.';
