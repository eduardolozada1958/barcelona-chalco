-- =============================================================================
-- Arreglar CURPs duplicadas y DESPUÉS crear el índice único (20260602).
-- Error 23505 al crear índice = aún hay 2+ jugadores activos con la misma CURP.
-- Error 42P01 = versión anterior del script; usa este archivo actualizado.
-- =============================================================================

-- ── PASO 1: Ver duplicados (ejecuta SOLO esta consulta primero) ─────────────
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


-- ── PASO 2: Fusionar duplicados (ejecuta TODO desde BEGIN hasta COMMIT) ───────
-- Conserva 1 jugador por CURP; archiva el resto (deleted_at).
-- Criterio: más vínculos de padres → tiene QR → tiene foto → más antiguo.

BEGIN;

CREATE TEMP TABLE _curp_fix (
  keep_id UUID NOT NULL,
  drop_id UUID NOT NULL,
  curp    VARCHAR(18) NOT NULL,
  PRIMARY KEY (drop_id)
) ON COMMIT DROP;

INSERT INTO _curp_fix (keep_id, drop_id, curp)
WITH ranked AS (
  SELECT
    p.id,
    p.curp,
    ROW_NUMBER() OVER (
      PARTITION BY p.curp
      ORDER BY
        (SELECT COUNT(*) FROM public.parent_players pp WHERE pp.player_id = p.id) DESC,
        (CASE WHEN p.qr_token IS NOT NULL THEN 1 ELSE 0 END) DESC,
        (CASE WHEN p.avatar_url IS NOT NULL AND btrim(p.avatar_url) <> '' THEN 1 ELSE 0 END) DESC,
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
SELECT k.keep_id, d.drop_id, k.curp
FROM keepers k
JOIN droppers d ON d.curp = k.curp;

-- Vínculos padre
UPDATE public.parent_players pp
SET player_id = f.keep_id
FROM _curp_fix f
WHERE pp.player_id = f.drop_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.parent_players x
    WHERE x.parent_id = pp.parent_id AND x.player_id = f.keep_id
  );

DELETE FROM public.parent_players pp
USING _curp_fix f
WHERE pp.player_id = f.drop_id;

-- Convocatorias
UPDATE public.match_convocatories mc
SET player_id = f.keep_id
FROM _curp_fix f
WHERE mc.player_id = f.drop_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.match_convocatories x
    WHERE x.match_id = mc.match_id AND x.player_id = f.keep_id
  );

DELETE FROM public.match_convocatories mc
USING _curp_fix f
WHERE mc.player_id = f.drop_id;

-- Estadísticas por partido
UPDATE public.player_stats ps
SET player_id = f.keep_id
FROM _curp_fix f
WHERE ps.player_id = f.drop_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.player_stats x
    WHERE x.result_id = ps.result_id AND x.player_id = f.keep_id
  );

DELETE FROM public.player_stats ps
USING _curp_fix f
WHERE ps.player_id = f.drop_id;

-- Resultados (jugador destacado)
UPDATE public.results r
SET featured_player_id = f.keep_id
FROM _curp_fix f
WHERE r.featured_player_id = f.drop_id;

-- MVP en ajustes del club (si aplica)
UPDATE public.club_settings cs
SET mvp_player_id = f.keep_id
FROM _curp_fix f
WHERE cs.mvp_player_id = f.drop_id;

-- Inscripciones convertidas (si existe la columna)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inscriptions'
      AND column_name = 'converted_player_id'
  ) THEN
    UPDATE public.inscriptions i
    SET converted_player_id = f.keep_id
    FROM _curp_fix f
    WHERE i.converted_player_id = f.drop_id;
  END IF;
END $$;

-- Archivar jugadores duplicados
UPDATE public.players p
SET deleted_at = NOW(),
    updated_at = NOW()
FROM _curp_fix f
WHERE p.id = f.drop_id;

COMMIT;


-- ── PASO 3: Comprobar (no debe devolver filas) ──────────────────────────────
SELECT curp, COUNT(*) AS n
FROM public.players
WHERE deleted_at IS NULL AND curp IS NOT NULL
GROUP BY curp
HAVING COUNT(*) > 1;

-- Si está vacío, ejecuta:
-- database/migrations/20260602_players_curp_unique.sql
