-- MVP de la semana (visible en inicio público). Se edita desde Plantilla en el panel.

ALTER TABLE public.club_settings
  ADD COLUMN IF NOT EXISTS mvp_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mvp_week_label TEXT,
  ADD COLUMN IF NOT EXISTS mvp_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.club_settings.mvp_player_id IS 'Jugador destacado como MVP de la semana (página de inicio).';
COMMENT ON COLUMN public.club_settings.mvp_week_label IS 'Etiqueta opcional, ej. Semana del 12 al 18 de mayo.';
