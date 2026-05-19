-- Comentarios en avisos y galería con moderación.
-- Padres comentan; admin/coach pueden hacerlo y se auto-aprueban.

CREATE TABLE IF NOT EXISTS public.comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('notice', 'gallery_post')),
  resource_id   UUID NOT NULL,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (LENGTH(TRIM(content)) BETWEEN 2 AND 1000),
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reject_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_comments_resource
  ON public.comments (resource_type, resource_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_user
  ON public.comments (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_status
  ON public.comments (status, created_at DESC);

COMMENT ON TABLE public.comments IS 'Comentarios de usuarios en avisos y galería; pasan por moderación.';
COMMENT ON COLUMN public.comments.status IS 'pending: padre, espera moderación; approved: visible público; rejected: visible solo al autor con motivo.';
