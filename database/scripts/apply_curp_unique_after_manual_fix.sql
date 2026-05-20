-- Usa esto SI YA archivaste el duplicado a mano (deleted_at en el registro sobrante).
-- No ejecutes fix_duplicate_curp.sql PASO 2 si ya lo hiciste manual.

-- 1) ¿Quedan CURPs duplicadas activas? (debe devolver 0 filas)
SELECT curp, COUNT(*) AS cuantos, array_agg(id::text) AS ids
FROM public.players
WHERE deleted_at IS NULL AND curp IS NOT NULL
GROUP BY curp
HAVING COUNT(*) > 1;

-- 2) Tu CURP (debe verse solo 1 fila activa)
SELECT id, first_name, last_name, created_at, deleted_at
FROM public.players
WHERE curp = 'LOQE980130HDFZRD06'
ORDER BY created_at;

-- 3) Si el paso 1 no devuelve filas, crea el índice único:
CREATE UNIQUE INDEX IF NOT EXISTS players_curp_unique_active
  ON public.players (curp)
  WHERE curp IS NOT NULL AND deleted_at IS NULL;

COMMENT ON INDEX players_curp_unique_active IS 'Impide dos jugadores activos con la misma CURP.';
