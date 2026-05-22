-- Búsqueda rápida sin acentos (Matias encuentra Matías)
CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS search_key text
  GENERATED ALWAYS AS (
    lower(unaccent(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_players_search_key ON players (search_key);
