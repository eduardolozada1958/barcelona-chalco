-- Ruta del PDF de CURP en Storage (bucket privado; solo el backend con service role sube/lee).
-- No exponer esta ruta en el front a coaches; la API devuelve solo curp_document_registered (boolean).

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS curp_document_path TEXT;

COMMENT ON COLUMN public.players.curp_document_path IS 'Object path en bucket privado (ej. {player_id}/{uuid}.pdf). Inmutable tras alta; sin URL pública.';
