-- Cambia el flujo: cualquier comentario de usuario autenticado se publica al instante.
-- 1) Auto-aprobar los comentarios que quedaron pendientes con el flujo anterior.
UPDATE public.comments
SET    status      = 'approved',
       reviewed_at = COALESCE(reviewed_at, NOW()),
       reviewed_by = COALESCE(reviewed_by, user_id)
WHERE  status = 'pending';

-- 2) Que el default de status para nuevos registros sea 'approved' (defensa en profundidad;
--    el backend ya lo fija explícitamente).
ALTER TABLE public.comments
  ALTER COLUMN status SET DEFAULT 'approved';
