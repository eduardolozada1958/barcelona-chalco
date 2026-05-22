-- Búsqueda rápida sin acentos (Matias encuentra Matías)
-- unaccent() no es IMMUTABLE; hace falta un envoltorio para columna GENERATED.

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.f_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
  SELECT public.unaccent('public.unaccent', $1);
$$;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS search_key text
  GENERATED ALWAYS AS (
    lower(public.f_unaccent(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_players_search_key ON players (search_key);
