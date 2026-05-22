-- Bucket público para portadas de avisos (subida desde panel admin).
-- Ejecutar en Supabase SQL Editor si el aviso falla con «Bucket not found».

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notices-covers',
  'notices-covers',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
