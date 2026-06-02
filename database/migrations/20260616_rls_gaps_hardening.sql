-- RLS: tablas faltantes + políticas deny en tablas con RLS sin política explícita.
-- El backend (service_role) no cambia. Protege acceso directo con anon/authenticated key.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'password_reset_tokens',
    'email_change_tokens',
    'performance_reports',
    'whatsapp_auth_files',
    'admin_sensitive_codes',
    'whatsapp_delivery_batches',
    'whatsapp_delivery_log'
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

    pol_anon := 'rls_deny_anon_' || t;
    pol_auth := 'rls_deny_authenticated_' || t;

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

    RAISE NOTICE 'RLS deny activado en public.%', t;
  END LOOP;
END $$;

COMMENT ON TABLE public.password_reset_tokens IS 'RLS: solo service_role (API Render).';
COMMENT ON TABLE public.email_change_tokens IS 'RLS: solo service_role (API Render).';
COMMENT ON TABLE public.performance_reports IS 'RLS: solo service_role (API Render).';
