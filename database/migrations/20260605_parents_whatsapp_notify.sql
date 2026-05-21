-- Notificaciones WhatsApp (Baileys): opt-in por padre verificado.
ALTER TABLE public.parents
  ADD COLUMN IF NOT EXISTS whatsapp_notify_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_notify_at TIMESTAMPTZ;

COMMENT ON COLUMN public.parents.whatsapp_notify_enabled IS 'Padre aceptó recibir avisos del club por WhatsApp (número secundario del club).';
COMMENT ON COLUMN public.parents.whatsapp_notify_at IS 'Fecha en que activó o desactivó WhatsApp.';
