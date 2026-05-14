-- Ejecutar en Supabase SQL Editor (o psql) después de desplegar el código que usa esta columna.
-- CURP mexicana: 18 caracteres; se guarda completa solo en admin; la API pública nunca la expone íntegra.

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS curp VARCHAR(18);

COMMENT ON COLUMN public.players.curp IS 'CURP del jugador (solo admin). Validación QR devuelve fragmento enmascarado.';
