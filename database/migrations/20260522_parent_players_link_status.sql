-- Vínculo padre↔jugador con flujo de aprobación (CURP). Ejecutar en Supabase SQL Editor.
-- Las filas existentes se consideran ya aprobadas.

ALTER TABLE public.parent_players
  ADD COLUMN IF NOT EXISTS relationship TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reject_reason TEXT;

UPDATE public.parent_players
SET status = 'approved'
WHERE status IS NULL OR TRIM(status) = '';

ALTER TABLE public.parent_players DROP CONSTRAINT IF EXISTS parent_players_status_check;
ALTER TABLE public.parent_players ADD CONSTRAINT parent_players_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

COMMENT ON COLUMN public.parent_players.status IS 'pending: espera admin; approved: visible en Mis jugadores; rejected: padre puede reenviar solicitud';
COMMENT ON COLUMN public.parent_players.relationship IS 'Parentesco declarado para este vínculo (mismo conjunto que parents.relationship)';

-- Un par padre-jugador = una sola fila; se actualiza status (p. ej. rejected → pending).
CREATE UNIQUE INDEX IF NOT EXISTS parent_players_parent_player_unique
  ON public.parent_players (parent_id, player_id);
