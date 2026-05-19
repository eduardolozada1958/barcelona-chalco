-- Desbloquear login tras 5 intentos fallidos (ejecutar en Supabase → SQL Editor).
-- Por correo:
UPDATE public.users
SET
  failed_login_attempts = 0,
  login_locked_at       = NULL
WHERE email = 'admin@barcelonamty.com'
  AND deleted_at IS NULL;

-- Verificar:
SELECT email, failed_login_attempts, login_locked_at, status
FROM public.users
WHERE email = 'admin@barcelonamty.com';
