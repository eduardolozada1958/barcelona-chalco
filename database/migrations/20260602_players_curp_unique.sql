-- CURP única por jugador activo (no borrado). Si falla por duplicados existentes,
-- fusiona o corrige manualmente los registros repetidos antes de ejecutar.
CREATE UNIQUE INDEX IF NOT EXISTS players_curp_unique_active
  ON public.players (curp)
  WHERE curp IS NOT NULL AND deleted_at IS NULL;

COMMENT ON INDEX players_curp_unique_active IS 'Impide dos jugadores activos con la misma CURP.';
