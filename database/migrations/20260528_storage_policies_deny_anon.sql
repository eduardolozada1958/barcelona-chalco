-- Políticas de Storage (Supabase SQL Editor).
-- NO ejecutes: ALTER TABLE storage.objects ...  → error 42501 "must be owner of table objects".
-- En Supabase, RLS en storage.objects ya viene activado por defecto.
--
-- El backend (service_role) ignora estas políticas y sigue igual.
-- Ejecuta este archivo completo en SQL Editor (rol: postgres).

-- ═══════════════════════════════════════════════════════════════
-- player-curp-documents (PRIVADO) — bloquear anon y authenticated
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "storage_block_player_curp_documents_anon" ON storage.objects;
CREATE POLICY "storage_block_player_curp_documents_anon"
  ON storage.objects
  FOR ALL TO anon
  USING (bucket_id = 'player-curp-documents' AND false)
  WITH CHECK (bucket_id = 'player-curp-documents' AND false);

DROP POLICY IF EXISTS "storage_block_player_curp_documents_authenticated" ON storage.objects;
CREATE POLICY "storage_block_player_curp_documents_authenticated"
  ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'player-curp-documents' AND false)
  WITH CHECK (bucket_id = 'player-curp-documents' AND false);

-- ═══════════════════════════════════════════════════════════════
-- Buckets PUBLIC — prohibir subir / editar / borrar con anon
-- (la lectura por URL pública del bucket no se toca)
-- ═══════════════════════════════════════════════════════════════

-- gallery
DROP POLICY IF EXISTS "storage_gallery_no_anon_insert" ON storage.objects;
CREATE POLICY "storage_gallery_no_anon_insert"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'gallery' AND false);

DROP POLICY IF EXISTS "storage_gallery_no_anon_update" ON storage.objects;
CREATE POLICY "storage_gallery_no_anon_update"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'gallery' AND false);

DROP POLICY IF EXISTS "storage_gallery_no_anon_delete" ON storage.objects;
CREATE POLICY "storage_gallery_no_anon_delete"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'gallery' AND false);

-- players-avatars
DROP POLICY IF EXISTS "storage_players_avatars_no_anon_insert" ON storage.objects;
CREATE POLICY "storage_players_avatars_no_anon_insert"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'players-avatars' AND false);

DROP POLICY IF EXISTS "storage_players_avatars_no_anon_update" ON storage.objects;
CREATE POLICY "storage_players_avatars_no_anon_update"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'players-avatars' AND false);

DROP POLICY IF EXISTS "storage_players_avatars_no_anon_delete" ON storage.objects;
CREATE POLICY "storage_players_avatars_no_anon_delete"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'players-avatars' AND false);

-- Opcional: descomenta si ya creaste estos buckets en Storage
/*
DROP POLICY IF EXISTS "storage_match_logos_no_anon_insert" ON storage.objects;
CREATE POLICY "storage_match_logos_no_anon_insert"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'match-logos' AND false);

DROP POLICY IF EXISTS "storage_notices_covers_no_anon_insert" ON storage.objects;
CREATE POLICY "storage_notices_covers_no_anon_insert"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'notices-covers' AND false);
*/
