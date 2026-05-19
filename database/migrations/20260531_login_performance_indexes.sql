-- Índices y ajustes para acelerar login y sesiones (ejecutar en Supabase SQL Editor).

-- Búsqueda por correo en login (.eq email + soft delete)
CREATE INDEX IF NOT EXISTS idx_users_email_active
  ON public.users (email)
  WHERE deleted_at IS NULL;

-- Revocar tokens al cerrar sesión / cambiar contraseña
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_active
  ON public.refresh_tokens (user_id)
  WHERE revoked = false;

-- Conteos del dashboard (home admin/coach)
CREATE INDEX IF NOT EXISTS idx_players_active_created
  ON public.players (created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inscriptions_pending
  ON public.inscriptions (status)
  WHERE deleted_at IS NULL AND status IN ('pending', 'under_review');
