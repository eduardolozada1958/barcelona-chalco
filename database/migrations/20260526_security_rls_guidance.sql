-- Guía de seguridad Supabase (RLS). Ejecutar y adaptar según tus políticas.
-- El backend usa SUPABASE_SERVICE_ROLE_KEY y bypasea RLS: la autorización vive en Express.
-- Aun así, activar RLS en tablas sensibles protege acceso directo con anon key.

-- Ejemplo: denegar todo por defecto en comentarios (solo service role desde backend)
-- ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "comments_deny_anon" ON public.comments FOR ALL TO anon USING (false);

-- players: nunca exponer curp ni qr_token vía anon
-- ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.comments IS
  'RLS recomendado: sin políticas públicas; el API usa service role con validación de roles.';
