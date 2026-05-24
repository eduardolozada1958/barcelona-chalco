-- Vistas públicas usadas por resultados y validación QR (versionadas en repo).
-- CREATE OR REPLACE: seguro en Supabase si ya existían creadas a mano.

CREATE OR REPLACE VIEW public.v_match_results AS
SELECT
  r.id,
  r.match_id,
  r.goals_scored,
  r.goals_conceded,
  r.outcome,
  r.match_report,
  r.highlight_url,
  r.featured_player_id,
  r.published,
  r.published_at,
  r.created_by,
  r.created_at,
  r.updated_at,
  m.title         AS match_title,
  m.opponent_name,
  m.opponent_logo_url,
  m.match_date,
  m.location,
  m.category,
  m.season,
  m.status        AS match_status
FROM public.results r
INNER JOIN public.matches m ON m.id = r.match_id
WHERE r.published = TRUE
  AND m.deleted_at IS NULL;

COMMENT ON VIEW public.v_match_results IS 'Resultados publicados con datos del partido (API pública / WhatsApp).';

CREATE OR REPLACE VIEW public.v_player_public_credential AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.birth_date,
  p.nationality,
  p.position,
  p.secondary_position,
  p.jersey_number,
  p.dominant_foot,
  p.height_cm,
  p.weight_kg,
  p.category,
  p.sport_description,
  p.avatar_url,
  p.is_verified,
  p.verified_at,
  p.season,
  p.achievements,
  p.qr_token,
  COALESCE(st.career_goals, 0)::integer       AS career_goals,
  COALESCE(st.career_assists, 0)::integer     AS career_assists,
  COALESCE(st.career_matches, 0)::integer     AS career_matches,
  COALESCE(st.career_avg_rating, 0)::numeric   AS career_avg_rating,
  cs.club_name,
  cs.club_logo_url,
  cs.season                                   AS club_season,
  cs.primary_color,
  cs.secondary_color
FROM public.players p
CROSS JOIN LATERAL (
  SELECT *
  FROM public.club_settings
  WHERE is_active = TRUE
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1
) cs
LEFT JOIN LATERAL (
  SELECT
    ps.player_id,
    SUM(ps.goals)::bigint                    AS career_goals,
    SUM(ps.assists)::bigint                  AS career_assists,
    COUNT(DISTINCT ps.result_id)::bigint     AS career_matches,
    AVG(ps.rating)                           AS career_avg_rating
  FROM public.player_stats ps
  INNER JOIN public.results res ON res.id = ps.result_id AND res.published = TRUE
  WHERE ps.player_id = p.id
  GROUP BY ps.player_id
) st ON TRUE
WHERE p.deleted_at IS NULL
  AND p.is_verified = TRUE;

COMMENT ON VIEW public.v_player_public_credential IS 'Datos de credencial QR para jugadores verificados.';
