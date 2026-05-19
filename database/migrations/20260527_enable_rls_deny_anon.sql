-- Activa RLS en todas las tablas de la app y bloquea acceso vía API con anon/authenticated.
--
-- ¿Afecta tu sitio (Cloudflare + Render)? NO, si el backend usa SUPABASE_SERVICE_ROLE_KEY.
-- Ese rol ignora RLS. La autorización sigue en Express (JWT, roles).
--
-- ¿Qué protege? Si alguien filtra SUPABASE_ANON_KEY y llama a la REST API de Supabase
-- directamente (sin pasar por Render), no podrá leer ni escribir estas tablas.
--
-- NO cubre Storage (buckets). Revisa políticas en Dashboard → Storage si hace falta.
-- Ejecutar una sola vez en Supabase → SQL Editor.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'users',
    'parents',
    'players',
    'parent_players',
    'matches',
    'match_convocatories',
    'results',
    'player_stats',
    'notices',
    'gallery_posts',
    'gallery_media',
    'comments',
    'inscriptions',
    'club_settings',
    'email_verification_tokens',
    'refresh_tokens',
    'push_subscriptions',
    'qr_validations'
  ];
  pol_anon text;
  pol_auth text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      RAISE NOTICE 'Tabla public.% no existe, se omite', t;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    pol_anon  := 'rls_deny_anon_' || t;
    pol_auth  := 'rls_deny_authenticated_' || t;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_anon, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO anon USING (false) WITH CHECK (false)',
      pol_anon, t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_auth, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (false) WITH CHECK (false)',
      pol_auth, t
    );

    RAISE NOTICE 'RLS activado en public.%', t;
  END LOOP;
END $$;

COMMENT ON SCHEMA public IS
  'RLS activo en tablas de la app. API Render (service_role) sin cambios. anon/authenticated bloqueados en tablas.';
