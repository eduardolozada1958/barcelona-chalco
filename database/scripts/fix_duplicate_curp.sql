-- =============================================================================
-- Arreglar CURPs duplicadas y DESPUÉS crear el índice único (20260602).
-- El error 23505 significa que aún hay 2+ jugadores activos con la misma CURP.
-- =============================================================================

-- ── PASO 1: Ver duplicados (ejecuta solo esto primero) ─────────────────────
SELECT
  p.curp,
  p.id,
  p.first_name || ' ' || p.last_name AS nombre,
  p.category,
  p.jersey_number,
  p.is_verified,
  p.created_at,
  (p.qr_token IS NOT NULL) AS tiene_qr,
  (SELECT COUNT(*) FROM public.parent_players pp WHERE pp.player_id = p.id) AS vinculos_padres,
  (SELECT COUNT(*) FROM public.player_stats ps WHERE ps.player_id = p.id) AS stats_partidos
FROM public.players p
WHERE p.deleted_at IS NULL
  AND p.curp IS NOT NULL
  AND p.curp IN (
    SELECT curp
    FROM public.players
    WHERE deleted_at IS NULL AND curp IS NOT NULL
    GROUP BY curp
    HAVING COUNT(*) > 1
  )
ORDER BY p.curp, p.created_at;

-- ── PASO 2: Fusionar y archivar duplicados (conserva 1 fila por CURP) ───────
-- Criterio: se queda el registro con más vínculos de padres, luego con QR,
-- luego el más antiguo. El resto se mueve a deleted_at (soft delete).
-- Ejecuta en una sola transacción; revisa el PASO 1 antes.

BEGIN;

WITH ranked AS (
  SELECT
    p.id,
    p.curp,
    ROW_NUMBER() OVER (
      PARTITION BY p.curp
      ORDER BY
        (SELECT COUNT(*) FROM public.parent_players pp WHERE pp.player_id = p.id) DESC,
        (CASE WHEN p.qr_token IS NOT NULL THEN 1 ELSE 0 END) DESC,
        (CASE WHEN p.avatar_url IS NOT NULL AND p.avatar_url <> '' THEN 1 ELSE 0 END) DESC,
        p.created_at ASC
    ) AS rn
  FROM public.players p
  WHERE p.deleted_at IS NULL
    AND p.curp IS NOT NULL
),
keepers AS (
  SELECT id AS keep_id, curp FROM ranked WHERE rn = 1
),
droppers AS (
  SELECT id AS drop_id, curp FROM ranked WHERE rn > 1
)
-- Vínculos padre → jugador que se conserva
UPDATE public.parent_players pp
SET player_id = k.keep_id
FROM droppers d
JOIN keepers k ON k.curp = d.curp
WHERE pp.player_id = d.drop_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.parent_players x
    WHERE x.parent_id = pp.parent_id AND x.player_id = k.keep_id
  );

WITH ranked AS (
  SELECT p.id, p.curp,
    ROW_NUMBER() OVER (
      PARTITION BY p.curp
      ORDER BY
        (SELECT COUNT(*) FROM public.parent_players pp WHERE pp.player_id = p.id) DESC,
        (CASE WHEN p.qr_token IS NOT NULL THEN 1 ELSE 0 END) DESC,
        (CASE WHEN p.avatar_url IS NOT NULL AND p.avatar_url <> '' THEN 1 ELSE 0 END) DESC,
        p.created_at ASC
    ) AS rn
  FROM public.players p
  WHERE p.deleted_at IS NULL AND p.curp IS NOT NULL
),
keepers AS (SELECT id AS keep_id, curp FROM ranked WHERE rn = 1),
droppers AS (SELECT id AS drop_id, curp FROM ranked WHERE rn > 1)
DELETE FROM public.parent_players pp
USING droppers d
WHERE pp.player_id = d.drop_id;

WITH ranked AS (
  SELECT p.id, p.curp,
    ROW_NUMBER() OVER (
      PARTITION BY p.curp
      ORDER BY
        (SELECT COUNT(*) FROM public.parent_players pp WHERE pp.player_id = p.id) DESC,
        (CASE WHEN p.qr_token IS NOT NULL THEN 1 ELSE 0 END) DESC,
        (CASE WHEN p.avatar_url IS NOT NULL AND p.avatar_url <> '' THEN 1 ELSE 0 END) DESC,
        p.created_at ASC
    ) AS rn
  FROM public.players p
  WHERE p.deleted_at IS NULL AND p.curp IS NOT NULL
),
keepers AS (SELECT id AS keep_id, curp FROM ranked WHERE rn = 1),
droppers AS (SELECT id AS drop_id, curp FROM ranked WHERE rn > 1)
UPDATE public.match_convocatories mc
SET player_id = k.keep_id
FROM droppers d
JOIN keepers k ON k.curp = d.curp
WHERE mc.player_id = d.drop_id
  AND NOT EXISTS (
    SELECT 1 FROM public.match_convocatories x
    WHERE x.match_id = mc.match_id AND x.player_id = k.keep_id
  );

WITH ranked AS (
  SELECT p.id, p.curp,
    ROW_NUMBER() OVER (
      PARTITION BY p.curp
      ORDER BY
        (SELECT COUNT(*) FROM public.parent_players pp WHERE pp.player_id = p.id) DESC,
        (CASE WHEN p.qr_token IS NOT NULL THEN 1 ELSE 0 END) DESC,
        (CASE WHEN p.avatar_url IS NOT NULL AND p.avatar_url <> '' THEN 1 ELSE 0 END) DESC,
        p.created_at ASC
    ) AS rn
  FROM public.players p
  WHERE p.deleted_at IS NULL AND p.curp IS NOT NULL
),
keepers AS (SELECT id AS keep_id, curp FROM ranked WHERE rn = 1),
droppers AS (SELECT id AS drop_id, curp FROM ranked WHERE rn > 1)
DELETE FROM public.match_convocatories mc
USING droppers d
WHERE mc.player_id = d.drop_id;

WITH ranked AS (
  SELECT p.id, p.curp,
    ROW_NUMBER() OVER (
      PARTITION BY p.curp
      ORDER BY
        (SELECT COUNT(*) FROM public.parent_players pp WHERE pp.player_id = p.id) DESC,
        (CASE WHEN p.qr_token IS NOT NULL THEN 1 ELSE 0 END) DESC,
        (CASE WHEN p.avatar_url IS NOT NULL AND p.avatar_url <> '' THEN 1 ELSE 0 END) DESC,
        p.created_at ASC
    ) AS rn
  FROM public.players p
  WHERE p.deleted_at IS NULL AND p.curp IS NOT NULL
),
keepers AS (SELECT id AS keep_id, curp FROM ranked WHERE rn = 1),
droppers AS (SELECT id AS drop_id, curp FROM ranked WHERE rn > 1)
UPDATE public.player_stats ps
SET player_id = k.keep_id
FROM droppers d
JOIN keepers k ON k.curp = d.curp
WHERE ps.player_id = d.drop_id
  AND NOT EXISTS (
    SELECT 1 FROM public.player_stats x
    WHERE x.result_id = ps.result_id AND x.player_id = k.keep_id
  );

WITH ranked AS (
  SELECT p.id, p.curp,
    ROW_NUMBER() OVER (
      PARTITION BY p.curp
      ORDER BY
        (SELECT COUNT(*) FROM public.parent_players pp WHERE pp.player_id = p.id) DESC,
        (CASE WHEN p.qr_token IS NOT NULL THEN 1 ELSE 0 END) DESC,
        (CASE WHEN p.avatar_url IS NOT NULL AND p.avatar_url <> '' THEN 1 ELSE 0 END) DESC,
        p.created_at ASC
    ) AS rn
  FROM public.players p
  WHERE p.deleted_at IS NULL AND p.curp IS NOT NULL
),
keepers AS (SELECT id AS keep_id, curp FROM ranked WHERE rn = 1),
droppers AS (SELECT id AS drop_id, curp FROM ranked WHERE rn > 1)
DELETE FROM public.player_stats ps
USING droppers d
WHERE ps.player_id = d.drop_id;

WITH ranked AS (
  SELECT p.id, p.curp,
    ROW_NUMBER() OVER (
      PARTITION BY p.curp
      ORDER BY
        (SELECT COUNT(*) FROM public.parent_players pp WHERE pp.player_id = p.id) DESC,
        (CASE WHEN p.qr_token IS NOT NULL THEN 1 ELSE 0 END) DESC,
        (CASE WHEN p.avatar_url IS NOT NULL AND p.avatar_url <> '' THEN 1 ELSE 0 END) DESC,
        p.created_at ASC
    ) AS rn
  FROM public.players p
  WHERE p.deleted_at IS NULL AND p.curp IS NOT NULL
),
keepers AS (SELECT id AS keep_id, curp FROM ranked WHERE rn = 1),
droppers AS (SELECT id AS drop_id, curp FROM ranked WHERE rn > 1)
UPDATE public.results r
SET featured_player_id = k.keep_id
FROM droppers d
JOIN keepers k ON k.curp = d.curp
WHERE r.featured_player_id = d.drop_id;

UPDATE public.club_settings
SET mvp_player_id = k.keep_id
FROM (
  WITH ranked AS (
    SELECT p.id, p.curp,
      ROW_NUMBER() OVER (
        PARTITION BY p.curp
        ORDER BY
          (SELECT COUNT(*) FROM public.parent_players pp WHERE pp.player_id = p.id) DESC,
          (CASE WHEN p.qr_token IS NOT NULL THEN 1 ELSE 0 END) DESC,
          (CASE WHEN p.avatar_url IS NOT NULL AND p.avatar_url <> '' THEN 1 ELSE 0 END) DESC,
          p.created_at ASC
      ) AS rn
    FROM public.players p
    WHERE p.deleted_at IS NULL AND p.curp IS NOT NULL
  ),
  keepers AS (SELECT id AS keep_id, curp FROM ranked WHERE rn = 1),
  droppers AS (SELECT id AS drop_id, curp FROM ranked WHERE rn > 1)
  SELECT k.keep_id, d.drop_id FROM droppers d JOIN keepers k ON k.curp = d.curp
) AS m
WHERE mvp_player_id = m.drop_id;

WITH ranked AS (
  SELECT p.id, p.curp,
    ROW_NUMBER() OVER (
      PARTITION BY p.curp
      ORDER BY
        (SELECT COUNT(*) FROM public.parent_players pp WHERE pp.player_id = p.id) DESC,
        (CASE WHEN p.qr_token IS NOT NULL THEN 1 ELSE 0 END) DESC,
        (CASE WHEN p.avatar_url IS NOT NULL AND p.avatar_url <> '' THEN 1 ELSE 0 END) DESC,
        p.created_at ASC
    ) AS rn
  FROM public.players p
  WHERE p.deleted_at IS NULL AND p.curp IS NOT NULL
),
droppers AS (SELECT id AS drop_id FROM ranked WHERE rn > 1)
UPDATE public.players p
SET deleted_at = NOW(), updated_at = NOW()
FROM droppers d
WHERE p.id = d.drop_id;

COMMIT;

-- ── PASO 3: Comprobar que ya no hay duplicados ────────────────────────────
SELECT curp, COUNT(*) AS n
FROM public.players
WHERE deleted_at IS NULL AND curp IS NOT NULL
GROUP BY curp
HAVING COUNT(*) > 1;

-- Si no devuelve filas, ejecuta la migración:
-- database/migrations/20260602_players_curp_unique.sql
