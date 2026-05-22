-- Archivar (ocultar sin borrar) y programar publicación + WhatsApp al llegar la fecha.

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

ALTER TABLE public.gallery_posts
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notices_scheduled_publish
  ON public.notices (scheduled_publish_at)
  WHERE scheduled_publish_at IS NOT NULL AND is_published = FALSE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gallery_scheduled_publish
  ON public.gallery_posts (scheduled_publish_at)
  WHERE scheduled_publish_at IS NOT NULL AND is_published = FALSE AND deleted_at IS NULL;
