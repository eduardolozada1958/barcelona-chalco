-- Titulares por partido: Fútbol 7 (7) o Fútbol 11 (11). Opcional.
ALTER TABLE matches ADD COLUMN IF NOT EXISTS formation_type text;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS starting_lineup jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matches_formation_type_check'
  ) THEN
    ALTER TABLE matches
      ADD CONSTRAINT matches_formation_type_check
      CHECK (formation_type IS NULL OR formation_type IN ('football_7', 'football_11'));
  END IF;
END $$;

COMMENT ON COLUMN matches.formation_type IS 'football_7 | football_11 — define cuántos titulares exige starting_lineup';
COMMENT ON COLUMN matches.starting_lineup IS 'Array JSON de UUIDs de jugadores en orden (7 u 11 elementos)';
