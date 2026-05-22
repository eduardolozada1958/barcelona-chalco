-- Códigos de verificación por correo para acciones sensibles de administrador.

CREATE TABLE IF NOT EXISTS public.admin_sensitive_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  target_id   UUID,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sensitive_codes_lookup
  ON public.admin_sensitive_codes (user_id, action, expires_at DESC)
  WHERE used_at IS NULL;

ALTER TABLE public.admin_sensitive_codes ENABLE ROW LEVEL SECURITY;
