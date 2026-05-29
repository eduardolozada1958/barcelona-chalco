-- Auditoría de envíos WhatsApp (panel admin): quién recibió, quién no y por qué.

CREATE TABLE IF NOT EXISTS public.whatsapp_delivery_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            TEXT NOT NULL,
  reference_id    TEXT,
  title           TEXT NOT NULL,
  message_preview TEXT,
  sent_count      INT NOT NULL DEFAULT 0,
  failed_count    INT NOT NULL DEFAULT 0,
  skipped_count   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.whatsapp_delivery_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID NOT NULL REFERENCES public.whatsapp_delivery_batches(id) ON DELETE CASCADE,
  parent_id         UUID REFERENCES public.parents(id) ON DELETE SET NULL,
  user_id           UUID REFERENCES public.users(id) ON DELETE SET NULL,
  parent_name       TEXT NOT NULL,
  email             TEXT,
  phone_masked      TEXT,
  link_status       TEXT NOT NULL DEFAULT 'unknown',
  approved_children INT NOT NULL DEFAULT 0,
  pending_children  INT NOT NULL DEFAULT 0,
  outcome           TEXT NOT NULL,
  skip_reason       TEXT,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_delivery_batches_created
  ON public.whatsapp_delivery_batches (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_delivery_log_batch
  ON public.whatsapp_delivery_log (batch_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_delivery_log_batch_outcome
  ON public.whatsapp_delivery_log (batch_id, outcome);

ALTER TABLE public.whatsapp_delivery_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_delivery_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.whatsapp_delivery_batches IS
  'Campañas/envíos masivos WhatsApp (avisos, partidos, recordatorios CURP, etc.).';
COMMENT ON TABLE public.whatsapp_delivery_log IS
  'Detalle por padre: enviado, fallido u omitido con motivo (vinculado o no).';
