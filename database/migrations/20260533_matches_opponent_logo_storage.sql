-- Escudo del rival: columna + bucket público en Storage.
-- Ejecutar en Supabase SQL Editor (rol postgres).

ALTER TABLE matches ADD COLUMN IF NOT EXISTS opponent_logo_url text;

COMMENT ON COLUMN matches.opponent_logo_url IS 'URL pública del escudo del rival (bucket match-logos)';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'match-logos',
  'match-logos',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
