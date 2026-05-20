-- Jugadores activos con la misma CURP (ejecutar antes del índice único 20260602).
SELECT curp, COUNT(*) AS n, array_agg(id::text ORDER BY created_at) AS player_ids,
       array_agg(first_name || ' ' || last_name ORDER BY created_at) AS names
FROM public.players
WHERE curp IS NOT NULL AND deleted_at IS NULL
GROUP BY curp
HAVING COUNT(*) > 1;
