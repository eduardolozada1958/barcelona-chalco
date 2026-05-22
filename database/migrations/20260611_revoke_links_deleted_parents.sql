-- Vínculos huérfanos: padres cuyo usuario ya fue eliminado antes del arreglo en cascada.

UPDATE public.parent_players pp
SET
  status        = 'rejected',
  reject_reason = 'Cuenta de padre/tutor eliminada por administración',
  reviewed_at   = NOW()
FROM public.parents p
JOIN public.users u ON u.id = p.user_id
WHERE pp.parent_id = p.id
  AND u.deleted_at IS NOT NULL
  AND pp.status IN ('pending', 'approved');

UPDATE public.parents p
SET deleted_at = u.deleted_at
FROM public.users u
WHERE p.user_id = u.id
  AND u.deleted_at IS NOT NULL
  AND p.deleted_at IS NULL;
