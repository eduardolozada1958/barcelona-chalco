-- Políticas de Storage: bloquear anon/authenticated en buckets sensibles.
-- El backend (service_role) sigue subiendo/leyendo sin cambios.
--
-- Buckets PUBLIC (gallery, players-avatars): las fotos se ven en la web por URL; es normal.
-- Bloqueamos que alguien con anon key suba o borre archivos por la API de Storage.
--
-- player-curp-documents: debe estar PRIVADO (sin etiqueta PUBLIC en el Dashboard).
-- Ejecutar en Supabase → SQL Editor.

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  b text;
  role_name text;
  pol text;
  private_buckets text[] := ARRAY['player-curp-documents'];
  public_buckets text[] := ARRAY['gallery', 'players-avatars', 'match-logos', 'notices-covers'];
BEGIN
  -- Buckets privados: ninguna operación con anon ni authenticated
  FOREACH b IN ARRAY private_buckets LOOP
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = b) THEN
      RAISE NOTICE 'Bucket % no existe, se omite', b;
      CONTINUE;
    END IF;

    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      pol := 'storage_block_' || replace(b, '-', '_') || '_' || role_name;
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol);
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR ALL TO %I USING (bucket_id = %L AND false) WITH CHECK (bucket_id = %L AND false)',
        pol, role_name, b, b
      );
    END LOOP;

    RAISE NOTICE 'Bucket privado % bloqueado para anon/authenticated', b;
  END LOOP;

  -- Buckets públicos: prohibir subir/editar/borrar con anon (lectura pública sigue por URL del bucket)
  FOREACH b IN ARRAY public_buckets LOOP
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = b) THEN
      RAISE NOTICE 'Bucket % no existe, se omite', b;
      CONTINUE;
    END IF;

    pol := 'storage_' || replace(b, '-', '_') || '_no_anon_insert';
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol);
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = %L AND false)',
      pol, b
    );

    pol := 'storage_' || replace(b, '-', '_') || '_no_anon_update';
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol);
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR UPDATE TO anon USING (bucket_id = %L AND false)',
      pol, b
    );

    pol := 'storage_' || replace(b, '-', '_') || '_no_anon_delete';
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol);
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR DELETE TO anon USING (bucket_id = %L AND false)',
      pol, b
    );

    RAISE NOTICE 'Bucket público %: escritura anon bloqueada', b;
  END LOOP;
END $$;
