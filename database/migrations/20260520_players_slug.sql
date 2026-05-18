-- Slug público para URLs amigables (/jugadores/eduardo-lozada-quiroz).
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_slug_active
  ON public.players (slug)
  WHERE deleted_at IS NULL AND slug IS NOT NULL;

-- Relleno inicial; homónimos reciben sufijo -2, -3, …
WITH base AS (
  SELECT
    id,
    trim(both '-' FROM regexp_replace(
      lower(concat_ws('-', first_name, last_name)),
      '[^a-z0-9]+',
      '-',
      'g'
    )) AS base_slug
  FROM public.players
  WHERE deleted_at IS NULL
),
numbered AS (
  SELECT
    id,
    base_slug,
    row_number() OVER (PARTITION BY base_slug ORDER BY created_at NULLS LAST, id) AS rn
  FROM base
  WHERE base_slug <> ''
)
UPDATE public.players p
SET slug = CASE
  WHEN n.rn = 1 THEN n.base_slug
  ELSE n.base_slug || '-' || n.rn::text
END
FROM numbered n
WHERE p.id = n.id
  AND (p.slug IS NULL OR p.slug = '');

COMMENT ON COLUMN public.players.slug IS 'URL pública única; ej. eduardo-lozada-quiroz o eduardo-lozada-2 si hay homónimo.';
