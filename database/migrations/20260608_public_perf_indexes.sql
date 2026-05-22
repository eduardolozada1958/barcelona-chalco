-- Rendimiento: perfiles públicos, avisos, partidos, estadísticas y QR

CREATE INDEX IF NOT EXISTS idx_players_slug_verified_active
  ON public.players (slug)
  WHERE deleted_at IS NULL AND is_verified = true AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_results_published_id
  ON public.results (id)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS idx_player_stats_result_id
  ON public.player_stats (result_id);

CREATE INDEX IF NOT EXISTS idx_notices_published_list
  ON public.notices (is_pinned DESC, published_at DESC)
  WHERE is_published = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_matches_public_date
  ON public.matches (match_date)
  WHERE deleted_at IS NULL;
