-- Genera QR para jugadores verificados que aún no tienen token (ej. Eduardo tras alta duplicada).
-- Ejecutar en Supabase SQL Editor después de desplegar el backend.

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id, first_name, last_name
    FROM public.players
    WHERE deleted_at IS NULL
      AND is_verified = true
      AND qr_token IS NULL
  LOOP
    PERFORM generate_player_qr_token(r.id);
    RAISE NOTICE 'QR generado: % % (%)', r.first_name, r.last_name, r.id;
  END LOOP;
END $$;
