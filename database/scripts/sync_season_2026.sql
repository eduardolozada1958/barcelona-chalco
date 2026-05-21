-- Sincroniza temporada 2026 en ajustes del club y registros antiguos (2024-2025).
-- Ejecutar en Supabase SQL Editor si el panel admin aún muestra temporada vieja en datos guardados.

UPDATE club_settings
SET season = '2026', updated_at = NOW()
WHERE is_active = TRUE;

UPDATE players
SET season = '2026', updated_at = NOW()
WHERE deleted_at IS NULL AND (season IS NULL OR season = '2024-2025');

UPDATE matches
SET season = '2026', updated_at = NOW()
WHERE deleted_at IS NULL AND (season IS NULL OR season = '2024-2025');

UPDATE results
SET season = '2026', updated_at = NOW()
WHERE deleted_at IS NULL AND (season IS NULL OR season = '2024-2025');

UPDATE gallery_items
SET season = '2026', updated_at = NOW()
WHERE deleted_at IS NULL AND (season IS NULL OR season = '2024-2025');
