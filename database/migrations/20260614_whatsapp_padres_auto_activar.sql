-- Activar avisos WhatsApp para padres elegibles (cuenta activa, correo verificado, hijo aprobado, teléfono).
-- Los padres pueden desactivarlos después en Mi perfil.

ALTER TABLE public.parents
  ALTER COLUMN whatsapp_notify_enabled SET DEFAULT TRUE;

UPDATE public.parents p
SET
  whatsapp_notify_enabled = TRUE,
  whatsapp_notify_at      = COALESCE(p.whatsapp_notify_at, NOW())
FROM public.users u
WHERE p.user_id = u.id
  AND p.deleted_at IS NULL
  AND u.deleted_at IS NULL
  AND u.role = 'parent'
  AND u.status = 'active'
  AND u.email_verified = TRUE
  AND (
    NULLIF(TRIM(u.phone), '') IS NOT NULL
    OR NULLIF(TRIM(p.phone_primary), '') IS NOT NULL
  )
  AND EXISTS (
    SELECT 1
    FROM public.parent_players pp
    WHERE pp.parent_id = p.id
      AND pp.status = 'approved'
  )
  AND p.whatsapp_notify_enabled = FALSE;

COMMENT ON COLUMN public.parents.whatsapp_notify_enabled IS
  'Padre recibe avisos del club por WhatsApp (partidos, resultados, avisos, galería, MVP). Puede desactivarlos en Mi perfil.';
