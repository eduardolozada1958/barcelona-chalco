-- Unifica categoría de partidos en "General" (sin ramas Sub-XX en calendario).
UPDATE matches SET category = 'General' WHERE deleted_at IS NULL AND (category IS DISTINCT FROM 'General');
