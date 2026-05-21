-- Sincroniza temporada 2026 en ajustes del club y registros antiguos (2024-2025).
-- Ejecutar en Supabase SQL Editor (bloques por separado o todo el archivo).

UPDATE club_settings
SET season = '2026', updated_at = NOW()
WHERE is_active = TRUE;

UPDATE players
SET season = '2026', updated_at = NOW()
WHERE deleted_at IS NULL AND (season IS NULL OR season = '2024-2025');

UPDATE matches
SET season = '2026', updated_at = NOW()
WHERE deleted_at IS NULL AND (season IS NULL OR season = '2024-2025');

-- La tabla results no tiene columna season (la temporada va en matches).
-- No ejecutar UPDATE sobre results.

UPDATE gallery_posts
SET season = '2026', updated_at = NOW()
WHERE deleted_at IS NULL AND (season IS NULL OR season = '2024-2025');
