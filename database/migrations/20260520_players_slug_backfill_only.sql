-- Si ya corriste la migración y falló en el UPDATE, ejecuta solo este bloque:
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
    row_number() OVER (PARTITION BY base_slug ORDER BY id) AS rn
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
