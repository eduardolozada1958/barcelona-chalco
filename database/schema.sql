-- ============================================================
-- ACADEMIA FÚTBOL BARCELONA
-- DATABASE SCHEMA - PostgreSQL / Supabase
-- Versión: 1.0.0
-- Compatible: PostgreSQL 15+ / Supabase
-- ============================================================

-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- FUNCIÓN GENÉRICA: update_updated_at_column
-- Usada por todos los triggers de updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role     AS ENUM ('admin', 'coach', 'parent');
CREATE TYPE user_status   AS ENUM ('active', 'inactive', 'suspended', 'pending');

CREATE TYPE player_status AS ENUM (
  'active',
  'inactive',
  'injured',
  'suspended',
  'pending_verification'
);
CREATE TYPE player_foot   AS ENUM ('right', 'left', 'both');

CREATE TYPE match_status  AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'postponed'
);
CREATE TYPE match_type    AS ENUM (
  'league',
  'cup',
  'friendly',
  'tournament',
  'internal'
);

CREATE TYPE convocatory_status AS ENUM (
  'called',
  'confirmed',
  'declined',
  'absent'
);

CREATE TYPE notice_type     AS ENUM (
  'general',
  'urgent',
  'event',
  'training',
  'match',
  'administrative'
);
CREATE TYPE notice_audience AS ENUM (
  'all',
  'parents',
  'players',
  'coaches',
  'specific_category'
);

CREATE TYPE gallery_post_type AS ENUM (
  'match_day',
  'result',
  'featured_player',
  'training',
  'convocatory',
  'general',
  'achievement'
);

CREATE TYPE media_type AS ENUM ('image', 'video');

CREATE TYPE inscription_status AS ENUM (
  'pending',
  'under_review',
  'approved',
  'rejected',
  'waitlist'
);

CREATE TYPE qr_validation_result AS ENUM (
  'valid',
  'invalid',
  'expired',
  'not_found'
);

-- ============================================================
-- TABLA: club_settings
-- Configuración global del club (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS club_settings (
  id                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_name          VARCHAR(150) NOT NULL    DEFAULT 'Academia Barcelona',
  club_logo_url      TEXT,
  club_description   TEXT,
  season             VARCHAR(20)  NOT NULL    DEFAULT '2024-2025',
  primary_color      VARCHAR(7)              DEFAULT '#D4AF37',
  secondary_color    VARCHAR(7)              DEFAULT '#1A1A2E',
  accent_color       VARCHAR(7)              DEFAULT '#0F3460',
  contact_email      VARCHAR(255),
  contact_phone      VARCHAR(30),
  contact_address    TEXT,
  website_url        TEXT,
  instagram_url      TEXT,
  facebook_url       TEXT,
  twitter_url        TEXT,
  is_active          BOOLEAN      NOT NULL    DEFAULT TRUE,
  created_at         TIMESTAMPTZ  NOT NULL    DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL    DEFAULT NOW(),

  CONSTRAINT club_settings_contact_email_format CHECK (
    contact_email IS NULL
    OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  CONSTRAINT club_settings_primary_color_format CHECK (
    primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  CONSTRAINT club_settings_secondary_color_format CHECK (
    secondary_color IS NULL OR secondary_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  CONSTRAINT club_settings_accent_color_format CHECK (
    accent_color IS NULL OR accent_color ~ '^#[0-9A-Fa-f]{6}$'
  )
);

CREATE TRIGGER trg_club_settings_updated_at
  BEFORE UPDATE ON club_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLA: users
-- Usuarios del sistema: admin, coach, parent
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                        UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                     VARCHAR(255) NOT NULL UNIQUE,
  password_hash             VARCHAR(255) NOT NULL,
  role                      user_role    NOT NULL DEFAULT 'parent',
  status                    user_status  NOT NULL DEFAULT 'active',
  full_name                 VARCHAR(150) NOT NULL,
  avatar_url                TEXT,
  phone                     VARCHAR(30),
  last_login_at             TIMESTAMPTZ,
  email_verified            BOOLEAN      NOT NULL DEFAULT FALSE,
  email_verified_at         TIMESTAMPTZ,
  password_reset_token      VARCHAR(255),
  password_reset_expires_at TIMESTAMPTZ,
  deleted_at                TIMESTAMPTZ,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT users_email_format CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  CONSTRAINT users_full_name_length CHECK (
    char_length(full_name) >= 2
  )
);

CREATE UNIQUE INDEX idx_users_email_active
  ON users(email)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_users_role
  ON users(role)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_users_status
  ON users(status)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLA: refresh_tokens
-- Control de sesiones JWT activas
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ  NOT NULL,
  revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
  revoked_at  TIMESTAMPTZ,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT refresh_tokens_expiry_future CHECK (
    expires_at > created_at
  )
);

CREATE INDEX idx_refresh_tokens_user_active
  ON refresh_tokens(user_id)
  WHERE revoked = FALSE;

CREATE INDEX idx_refresh_tokens_hash_active
  ON refresh_tokens(token_hash)
  WHERE revoked = FALSE;

CREATE INDEX idx_refresh_tokens_expires
  ON refresh_tokens(expires_at);

-- ============================================================
-- TABLA: parents
-- Perfil extendido de padres/tutores
-- ============================================================
CREATE TABLE IF NOT EXISTS parents (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name              VARCHAR(100) NOT NULL,
  last_name               VARCHAR(100) NOT NULL,
  phone_primary           VARCHAR(30)  NOT NULL,
  phone_secondary         VARCHAR(30),
  relationship            VARCHAR(50)  NOT NULL DEFAULT 'padre',
  occupation              VARCHAR(100),
  emergency_contact_name  VARCHAR(150),
  emergency_contact_phone VARCHAR(30),
  notes                   TEXT,
  deleted_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT parents_relationship_valid CHECK (
    relationship IN ('padre', 'madre', 'tutor', 'tutora', 'abuelo', 'abuela', 'tio', 'tia', 'otro')
  ),
  CONSTRAINT parents_first_name_length CHECK (char_length(first_name) >= 2),
  CONSTRAINT parents_last_name_length  CHECK (char_length(last_name) >= 2)
);

CREATE INDEX idx_parents_user_id
  ON parents(user_id);

CREATE INDEX idx_parents_last_name
  ON parents(last_name)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_parents_updated_at
  BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLA: players
-- Jugadores de la academia
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
  id                  UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name          VARCHAR(100)   NOT NULL,
  last_name           VARCHAR(100)   NOT NULL,
  birth_date          DATE           NOT NULL,
  nationality         VARCHAR(100)              DEFAULT 'Mexicana',
  position            VARCHAR(80)    NOT NULL,
  secondary_position  VARCHAR(80),
  jersey_number       SMALLINT,
  dominant_foot       player_foot    NOT NULL    DEFAULT 'right',
  height_cm           SMALLINT,
  weight_kg           SMALLINT,
  category            VARCHAR(50)    NOT NULL,
  sport_description   TEXT,
  avatar_url          TEXT,
  status              player_status  NOT NULL    DEFAULT 'pending_verification',
  is_verified         BOOLEAN        NOT NULL    DEFAULT FALSE,
  verified_at         TIMESTAMPTZ,
  verified_by         UUID                       REFERENCES users(id),
  qr_token            VARCHAR(255)               UNIQUE,
  qr_generated_at     TIMESTAMPTZ,
  season              VARCHAR(20)    NOT NULL    DEFAULT '2024-2025',
  achievements        TEXT,
  notes               TEXT,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ    NOT NULL    DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL    DEFAULT NOW(),

  CONSTRAINT players_jersey_number_range CHECK (
    jersey_number IS NULL OR (jersey_number >= 1 AND jersey_number <= 99)
  ),
  CONSTRAINT players_height_range CHECK (
    height_cm IS NULL OR (height_cm >= 80 AND height_cm <= 250)
  ),
  CONSTRAINT players_weight_range CHECK (
    weight_kg IS NULL OR (weight_kg >= 15 AND weight_kg <= 150)
  ),
  CONSTRAINT players_birth_date_range CHECK (
    birth_date >= '1995-01-01' AND birth_date <= CURRENT_DATE
  ),
  CONSTRAINT players_first_name_length CHECK (char_length(first_name) >= 2),
  CONSTRAINT players_last_name_length  CHECK (char_length(last_name) >= 2)
);

CREATE INDEX idx_players_last_name
  ON players(last_name)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_players_category
  ON players(category)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_players_status
  ON players(status)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_players_qr_token
  ON players(qr_token)
  WHERE deleted_at IS NULL AND qr_token IS NOT NULL;

CREATE INDEX idx_players_season
  ON players(season)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_players_is_verified
  ON players(is_verified)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_players_jersey_category
  ON players(category, jersey_number)
  WHERE deleted_at IS NULL AND jersey_number IS NOT NULL;

CREATE TRIGGER trg_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLA: parent_players
-- Relación N:M entre padres y jugadores
-- ============================================================
CREATE TABLE IF NOT EXISTS parent_players (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id           UUID        NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  player_id           UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  is_primary_contact  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(parent_id, player_id)
);

CREATE INDEX idx_parent_players_parent
  ON parent_players(parent_id);

CREATE INDEX idx_parent_players_player
  ON parent_players(player_id);

-- ============================================================
-- TABLA: qr_validations
-- Auditoría de escaneos de credencial QR
-- ============================================================
CREATE TABLE IF NOT EXISTS qr_validations (
  id           UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id    UUID                  NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  qr_token     VARCHAR(255)          NOT NULL,
  result       qr_validation_result  NOT NULL DEFAULT 'valid',
  validated_at TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  ip_address   INET,
  user_agent   TEXT
);

CREATE INDEX idx_qr_validations_player
  ON qr_validations(player_id);

CREATE INDEX idx_qr_validations_token
  ON qr_validations(qr_token);

CREATE INDEX idx_qr_validations_date
  ON qr_validations(validated_at DESC);

-- ============================================================
-- TABLA: matches
-- Partidos del club
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             VARCHAR(200) NOT NULL,
  description       TEXT,
  opponent_name     VARCHAR(150) NOT NULL,
  opponent_logo_url TEXT,
  match_date        TIMESTAMPTZ  NOT NULL,
  location          VARCHAR(200) NOT NULL,
  location_maps_url TEXT,
  match_type        match_type   NOT NULL DEFAULT 'league',
  category          VARCHAR(50)  NOT NULL,
  status            match_status NOT NULL DEFAULT 'scheduled',
  is_home           BOOLEAN      NOT NULL DEFAULT TRUE,
  banner_url        TEXT,
  season            VARCHAR(20)  NOT NULL DEFAULT '2024-2025',
  created_by        UUID         NOT NULL REFERENCES users(id),
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT matches_title_length CHECK (char_length(title) >= 3),
  CONSTRAINT matches_opponent_length CHECK (char_length(opponent_name) >= 2)
);

CREATE INDEX idx_matches_date
  ON matches(match_date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_matches_status
  ON matches(status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_matches_category
  ON matches(category)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_matches_season
  ON matches(season)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_matches_upcoming
  ON matches(match_date ASC)
  WHERE deleted_at IS NULL AND status = 'scheduled';

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLA: match_convocatories
-- Convocatorias de jugadores por partido
-- ============================================================
CREATE TABLE IF NOT EXISTS match_convocatories (
  id           UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id     UUID                 NOT NULL REFERENCES matches(id)  ON DELETE CASCADE,
  player_id    UUID                 NOT NULL REFERENCES players(id)  ON DELETE CASCADE,
  status       convocatory_status   NOT NULL DEFAULT 'called',
  notes        TEXT,
  called_at    TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  UNIQUE(match_id, player_id),

  CONSTRAINT convocatory_responded_at_valid CHECK (
    responded_at IS NULL OR responded_at >= called_at
  )
);

CREATE INDEX idx_convocatories_match
  ON match_convocatories(match_id);

CREATE INDEX idx_convocatories_player
  ON match_convocatories(player_id);

-- ============================================================
-- TABLA: results
-- Resultados de partidos
-- ============================================================
CREATE TABLE IF NOT EXISTS results (
  id                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id           UUID         NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  goals_scored       SMALLINT     NOT NULL DEFAULT 0,
  goals_conceded     SMALLINT     NOT NULL DEFAULT 0,
  -- Columna generada automáticamente según marcador
  outcome            VARCHAR(10)  GENERATED ALWAYS AS (
    CASE
      WHEN goals_scored > goals_conceded THEN 'win'
      WHEN goals_scored < goals_conceded THEN 'loss'
      ELSE 'draw'
    END
  ) STORED,
  match_report       TEXT,
  highlight_url      TEXT,
  featured_player_id UUID                    REFERENCES players(id),
  published          BOOLEAN      NOT NULL DEFAULT FALSE,
  published_at       TIMESTAMPTZ,
  created_by         UUID         NOT NULL REFERENCES users(id),
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT results_goals_scored_positive   CHECK (goals_scored >= 0),
  CONSTRAINT results_goals_conceded_positive CHECK (goals_conceded >= 0),
  CONSTRAINT results_published_at_valid CHECK (
    published_at IS NULL OR published = TRUE
  )
);

CREATE INDEX idx_results_match     ON results(match_id);
CREATE INDEX idx_results_published ON results(published);
CREATE INDEX idx_results_outcome   ON results(outcome) WHERE published = TRUE;

CREATE TRIGGER trg_results_updated_at
  BEFORE UPDATE ON results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLA: player_stats
-- Estadísticas individuales por jugador por partido
-- ============================================================
CREATE TABLE IF NOT EXISTS player_stats (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  result_id      UUID         NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  player_id      UUID         NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  goals          SMALLINT     NOT NULL DEFAULT 0,
  assists        SMALLINT     NOT NULL DEFAULT 0,
  yellow_cards   SMALLINT     NOT NULL DEFAULT 0,
  red_cards      SMALLINT     NOT NULL DEFAULT 0,
  minutes_played SMALLINT     NOT NULL DEFAULT 0,
  rating         DECIMAL(3,1),
  notes          TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE(result_id, player_id),

  CONSTRAINT player_stats_goals_positive         CHECK (goals >= 0),
  CONSTRAINT player_stats_assists_positive       CHECK (assists >= 0),
  CONSTRAINT player_stats_yellow_cards_range     CHECK (yellow_cards >= 0 AND yellow_cards <= 2),
  CONSTRAINT player_stats_red_cards_range        CHECK (red_cards >= 0 AND red_cards <= 1),
  CONSTRAINT player_stats_minutes_range          CHECK (minutes_played >= 0 AND minutes_played <= 120),
  CONSTRAINT player_stats_rating_range           CHECK (rating IS NULL OR (rating >= 1.0 AND rating <= 10.0))
);

CREATE INDEX idx_player_stats_result ON player_stats(result_id);
CREATE INDEX idx_player_stats_player ON player_stats(player_id);

CREATE TRIGGER trg_player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLA: notices
-- Avisos/comunicados del club
-- ============================================================
CREATE TABLE IF NOT EXISTS notices (
  id              UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(200)     NOT NULL,
  content         TEXT             NOT NULL,
  type            notice_type      NOT NULL DEFAULT 'general',
  audience        notice_audience  NOT NULL DEFAULT 'all',
  target_category VARCHAR(50),
  is_published    BOOLEAN          NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  is_pinned       BOOLEAN          NOT NULL DEFAULT FALSE,
  cover_image_url TEXT,
  created_by      UUID             NOT NULL REFERENCES users(id),
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT notices_title_length CHECK (char_length(title) >= 3),
  CONSTRAINT notices_content_length CHECK (char_length(content) >= 10),
  CONSTRAINT notices_target_required CHECK (
    audience != 'specific_category' OR target_category IS NOT NULL
  ),
  CONSTRAINT notices_expiry_after_publish CHECK (
    expires_at IS NULL OR published_at IS NULL OR expires_at > published_at
  )
);

CREATE INDEX idx_notices_published
  ON notices(is_published, published_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_notices_type
  ON notices(type)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_notices_audience
  ON notices(audience)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_notices_pinned
  ON notices(is_pinned, published_at DESC)
  WHERE deleted_at IS NULL AND is_published = TRUE;

CREATE TRIGGER trg_notices_updated_at
  BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLA: gallery_posts
-- Publicaciones tipo Instagram del club
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery_posts (
  id                UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             VARCHAR(200)      NOT NULL,
  caption           TEXT,
  type              gallery_post_type NOT NULL DEFAULT 'general',
  related_match_id  UUID                         REFERENCES matches(id),
  related_player_id UUID                         REFERENCES players(id),
  is_published      BOOLEAN           NOT NULL DEFAULT FALSE,
  published_at      TIMESTAMPTZ,
  views_count       INTEGER           NOT NULL DEFAULT 0,
  likes_count       INTEGER           NOT NULL DEFAULT 0,
  is_featured       BOOLEAN           NOT NULL DEFAULT FALSE,
  season            VARCHAR(20)       NOT NULL DEFAULT '2024-2025',
  created_by        UUID              NOT NULL REFERENCES users(id),
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT gallery_posts_title_length  CHECK (char_length(title) >= 3),
  CONSTRAINT gallery_posts_views_positive CHECK (views_count >= 0),
  CONSTRAINT gallery_posts_likes_positive CHECK (likes_count >= 0)
);

CREATE INDEX idx_gallery_published
  ON gallery_posts(is_published, published_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_gallery_type
  ON gallery_posts(type)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_gallery_featured
  ON gallery_posts(is_featured, published_at DESC)
  WHERE deleted_at IS NULL AND is_published = TRUE;

CREATE INDEX idx_gallery_season
  ON gallery_posts(season)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_gallery_related_match
  ON gallery_posts(related_match_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_gallery_related_player
  ON gallery_posts(related_player_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_gallery_posts_updated_at
  BEFORE UPDATE ON gallery_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLA: gallery_media
-- Archivos multimedia (imágenes/videos) de cada post
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery_media (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id          UUID        NOT NULL REFERENCES gallery_posts(id) ON DELETE CASCADE,
  url              TEXT        NOT NULL,
  type             media_type  NOT NULL DEFAULT 'image',
  thumbnail_url    TEXT,
  caption          TEXT,
  sort_order       SMALLINT    NOT NULL DEFAULT 0,
  file_size_bytes  INTEGER,
  width_px         SMALLINT,
  height_px        SMALLINT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT gallery_media_file_size_positive CHECK (
    file_size_bytes IS NULL OR file_size_bytes > 0
  ),
  CONSTRAINT gallery_media_dimensions_positive CHECK (
    (width_px IS NULL OR width_px > 0) AND
    (height_px IS NULL OR height_px > 0)
  )
);

CREATE INDEX idx_gallery_media_post
  ON gallery_media(post_id, sort_order ASC);

-- ============================================================
-- TABLA: inscriptions
-- Solicitudes públicas de inscripción a la academia
-- ============================================================
CREATE TABLE IF NOT EXISTS inscriptions (
  id                      UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Datos del padre/tutor
  parent_first_name       VARCHAR(100)        NOT NULL,
  parent_last_name        VARCHAR(100)        NOT NULL,
  parent_email            VARCHAR(255)        NOT NULL,
  parent_phone            VARCHAR(30)         NOT NULL,
  parent_relationship     VARCHAR(50)         NOT NULL DEFAULT 'padre',

  -- Datos del jugador
  player_first_name       VARCHAR(100)        NOT NULL,
  player_last_name        VARCHAR(100)        NOT NULL,
  player_birth_date       DATE                NOT NULL,
  player_nationality      VARCHAR(100)                  DEFAULT 'Mexicana',
  player_position         VARCHAR(80)         NOT NULL,
  player_dominant_foot    player_foot         NOT NULL  DEFAULT 'right',
  player_height_cm        SMALLINT,
  player_weight_kg        SMALLINT,
  player_category         VARCHAR(50)         NOT NULL,
  player_previous_club    VARCHAR(150),
  player_sport_description TEXT,
  player_avatar_url       TEXT,

  -- Gestión administrativa
  status                  inscription_status  NOT NULL  DEFAULT 'pending',
  reviewed_by             UUID                          REFERENCES users(id),
  reviewed_at             TIMESTAMPTZ,
  review_notes            TEXT,
  rejection_reason        TEXT,
  converted_player_id     UUID                          REFERENCES players(id),
  converted_at            TIMESTAMPTZ,

  -- Meta
  ip_address              INET,
  deleted_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ         NOT NULL  DEFAULT NOW(),
  updated_at              TIMESTAMPTZ         NOT NULL  DEFAULT NOW(),

  CONSTRAINT inscriptions_parent_email_format CHECK (
    parent_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  CONSTRAINT inscriptions_birth_date_range CHECK (
    player_birth_date >= '1995-01-01' AND player_birth_date <= CURRENT_DATE
  ),
  CONSTRAINT inscriptions_rejection_reason_required CHECK (
    status != 'rejected' OR rejection_reason IS NOT NULL
  ),
  CONSTRAINT inscriptions_player_height_range CHECK (
    player_height_cm IS NULL OR (player_height_cm >= 80 AND player_height_cm <= 250)
  ),
  CONSTRAINT inscriptions_player_weight_range CHECK (
    player_weight_kg IS NULL OR (player_weight_kg >= 15 AND player_weight_kg <= 150)
  ),
  CONSTRAINT inscriptions_relationship_valid CHECK (
    parent_relationship IN ('padre', 'madre', 'tutor', 'tutora', 'abuelo', 'abuela', 'tio', 'tia', 'otro')
  )
);

CREATE INDEX idx_inscriptions_status
  ON inscriptions(status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_inscriptions_email
  ON inscriptions(parent_email)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_inscriptions_date
  ON inscriptions(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_inscriptions_category
  ON inscriptions(player_category)
  WHERE deleted_at IS NULL;

CREATE TRIGGER trg_inscriptions_updated_at
  BEFORE UPDATE ON inscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VISTAS
-- ============================================================

-- Vista: estadísticas de carrera por jugador
CREATE OR REPLACE VIEW v_player_career_stats AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.position,
  p.secondary_position,
  p.category,
  p.jersey_number,
  p.dominant_foot,
  p.height_cm,
  p.weight_kg,
  p.avatar_url,
  p.status,
  p.is_verified,
  p.season,
  COUNT(DISTINCT ps.result_id)          AS matches_played,
  COALESCE(SUM(ps.goals), 0)            AS total_goals,
  COALESCE(SUM(ps.assists), 0)          AS total_assists,
  COALESCE(SUM(ps.yellow_cards), 0)     AS total_yellow_cards,
  COALESCE(SUM(ps.red_cards), 0)        AS total_red_cards,
  COALESCE(SUM(ps.minutes_played), 0)   AS total_minutes,
  ROUND(COALESCE(AVG(ps.rating), 0), 2) AS avg_rating
FROM players p
LEFT JOIN player_stats ps ON ps.player_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY
  p.id, p.first_name, p.last_name, p.position,
  p.secondary_position, p.category, p.jersey_number,
  p.dominant_foot, p.height_cm, p.weight_kg,
  p.avatar_url, p.status, p.is_verified, p.season;

-- Vista: últimos resultados publicados con datos del partido
CREATE OR REPLACE VIEW v_match_results AS
SELECT
  m.id              AS match_id,
  m.title,
  m.opponent_name,
  m.opponent_logo_url,
  m.match_date,
  m.location,
  m.category,
  m.is_home,
  m.banner_url,
  m.season,
  r.id              AS result_id,
  r.goals_scored,
  r.goals_conceded,
  r.outcome,
  r.match_report,
  r.highlight_url,
  r.featured_player_id,
  fp.first_name     AS featured_player_first_name,
  fp.last_name      AS featured_player_last_name,
  fp.avatar_url     AS featured_player_avatar,
  fp.position       AS featured_player_position
FROM matches m
JOIN   results r  ON r.match_id = m.id AND r.published = TRUE
LEFT JOIN players fp ON fp.id = r.featured_player_id
WHERE m.deleted_at IS NULL
ORDER BY m.match_date DESC;

-- Vista: próximos partidos con conteo de convocados
CREATE OR REPLACE VIEW v_upcoming_matches AS
SELECT
  m.id,
  m.title,
  m.opponent_name,
  m.opponent_logo_url,
  m.match_date,
  m.location,
  m.location_maps_url,
  m.match_type,
  m.category,
  m.is_home,
  m.banner_url,
  m.status,
  m.season,
  COUNT(mc.id) AS players_called
FROM matches m
LEFT JOIN match_convocatories mc ON mc.match_id = m.id
WHERE m.deleted_at IS NULL
  AND m.status = 'scheduled'
  AND m.match_date > NOW()
GROUP BY
  m.id, m.title, m.opponent_name, m.opponent_logo_url,
  m.match_date, m.location, m.location_maps_url, m.match_type,
  m.category, m.is_home, m.banner_url, m.status, m.season
ORDER BY m.match_date ASC;

-- Vista: resumen del dashboard admin
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM players WHERE deleted_at IS NULL AND status = 'active')       AS active_players,
  (SELECT COUNT(*) FROM players WHERE deleted_at IS NULL AND is_verified = FALSE)      AS pending_verifications,
  (SELECT COUNT(*) FROM inscriptions WHERE deleted_at IS NULL AND status = 'pending')  AS pending_inscriptions,
  (SELECT COUNT(*) FROM matches WHERE deleted_at IS NULL AND status = 'scheduled' AND match_date > NOW()) AS upcoming_matches,
  (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role = 'parent')            AS registered_parents,
  (SELECT COUNT(*) FROM notices WHERE deleted_at IS NULL AND is_published = TRUE)      AS published_notices;

-- Vista: credencial pública del jugador (para QR)
CREATE OR REPLACE VIEW v_player_public_credential AS
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
  -- Estadísticas básicas
  COALESCE(cs.total_goals, 0)    AS career_goals,
  COALESCE(cs.total_assists, 0)  AS career_assists,
  COALESCE(cs.matches_played, 0) AS career_matches,
  COALESCE(cs.avg_rating, 0)     AS career_avg_rating,
  -- Configuración del club
  cls.club_name,
  cls.club_logo_url,
  cls.season        AS club_season,
  cls.primary_color,
  cls.secondary_color
FROM players p
LEFT JOIN v_player_career_stats cs ON cs.id = p.id
CROSS JOIN LATERAL (
  SELECT club_name, club_logo_url, season, primary_color, secondary_color
  FROM club_settings
  WHERE is_active = TRUE
  LIMIT 1
) cls
WHERE p.deleted_at IS NULL;

-- ============================================================
-- FUNCIONES
-- ============================================================

-- Genera un token QR único para un jugador
CREATE OR REPLACE FUNCTION generate_player_qr_token(p_player_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_token VARCHAR(255);
BEGIN
  -- Generar token aleatorio seguro
  v_token := encode(gen_random_bytes(32), 'hex');

  UPDATE players
  SET qr_token = v_token, qr_generated_at = NOW()
  WHERE id = p_player_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jugador no encontrado: %', p_player_id;
  END IF;

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Convierte una inscripción aprobada en un jugador registrado
CREATE OR REPLACE FUNCTION convert_inscription_to_player(
  p_inscription_id UUID,
  p_reviewed_by    UUID
)
RETURNS UUID AS $$
DECLARE
  v_inscription inscriptions%ROWTYPE;
  v_player_id   UUID;
BEGIN
  SELECT * INTO v_inscription
  FROM inscriptions
  WHERE id = p_inscription_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inscripción no encontrada: %', p_inscription_id;
  END IF;

  IF v_inscription.status != 'approved' THEN
    RAISE EXCEPTION 'La inscripción debe estar en estado "approved" para convertirse. Estado actual: %', v_inscription.status;
  END IF;

  IF v_inscription.converted_player_id IS NOT NULL THEN
    RAISE EXCEPTION 'Esta inscripción ya fue convertida al jugador %', v_inscription.converted_player_id;
  END IF;

  INSERT INTO players (
    first_name,
    last_name,
    birth_date,
    nationality,
    position,
    dominant_foot,
    height_cm,
    weight_kg,
    category,
    sport_description,
    avatar_url,
    status
  ) VALUES (
    v_inscription.player_first_name,
    v_inscription.player_last_name,
    v_inscription.player_birth_date,
    v_inscription.player_nationality,
    v_inscription.player_position,
    v_inscription.player_dominant_foot,
    v_inscription.player_height_cm,
    v_inscription.player_weight_kg,
    v_inscription.player_category,
    v_inscription.player_sport_description,
    v_inscription.player_avatar_url,
    'pending_verification'
  ) RETURNING id INTO v_player_id;

  UPDATE inscriptions
  SET
    converted_player_id = v_player_id,
    converted_at        = NOW()
  WHERE id = p_inscription_id;

  RETURN v_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Registra un intento de validación QR
CREATE OR REPLACE FUNCTION log_qr_validation(
  p_qr_token  VARCHAR,
  p_ip        INET    DEFAULT NULL,
  p_agent     TEXT    DEFAULT NULL
)
RETURNS TABLE(
  is_valid   BOOLEAN,
  player_id  UUID,
  result     qr_validation_result
) AS $$
DECLARE
  v_player   players%ROWTYPE;
  v_result   qr_validation_result;
BEGIN
  SELECT * INTO v_player
  FROM players
  WHERE qr_token = p_qr_token AND deleted_at IS NULL;

  IF NOT FOUND THEN
    v_result := 'not_found';
    INSERT INTO qr_validations (player_id, qr_token, result, ip_address, user_agent)
    VALUES (
      '00000000-0000-0000-0000-000000000000'::UUID,
      p_qr_token, v_result, p_ip, p_agent
    );
    RETURN QUERY SELECT FALSE, NULL::UUID, v_result;
    RETURN;
  END IF;

  IF v_player.status != 'active' OR v_player.is_verified = FALSE THEN
    v_result := 'invalid';
  ELSE
    v_result := 'valid';
  END IF;

  INSERT INTO qr_validations (player_id, qr_token, result, ip_address, user_agent)
  VALUES (v_player.id, p_qr_token, v_result, p_ip, p_agent);

  RETURN QUERY SELECT (v_result = 'valid'), v_player.id, v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Activado para tablas sensibles.
-- Las políticas se administran principalmente via JWT + backend.
-- ============================================================
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE players           ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_players    ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE results           ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_convocatories ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_validations    ENABLE ROW LEVEL SECURITY;

-- Política: permitir acceso completo al service role (backend)
-- Las políticas RLS para anon/authenticated se configuran en Supabase Dashboard
-- según los requisitos específicos de acceso público vs. autenticado.

-- ============================================================
-- COMENTARIOS DE TABLAS (documentación en base de datos)
-- ============================================================
COMMENT ON TABLE users               IS 'Usuarios del sistema: admin, coach, parent';
COMMENT ON TABLE parents             IS 'Perfiles de padres y tutores vinculados a jugadores';
COMMENT ON TABLE players             IS 'Jugadores registrados en la academia';
COMMENT ON TABLE parent_players      IS 'Relación N:M entre padres y jugadores';
COMMENT ON TABLE qr_validations      IS 'Auditoría de escaneos de credencial QR';
COMMENT ON TABLE matches             IS 'Partidos programados y completados';
COMMENT ON TABLE match_convocatories IS 'Convocatorias de jugadores por partido';
COMMENT ON TABLE results             IS 'Resultados finales de partidos';
COMMENT ON TABLE player_stats        IS 'Estadísticas individuales por jugador por partido';
COMMENT ON TABLE notices             IS 'Avisos y comunicados del club';
COMMENT ON TABLE gallery_posts       IS 'Publicaciones de galería tipo Instagram';
COMMENT ON TABLE gallery_media       IS 'Archivos multimedia de publicaciones de galería';
COMMENT ON TABLE inscriptions        IS 'Solicitudes de inscripción a la academia';
COMMENT ON TABLE club_settings       IS 'Configuración global del club (singleton)';
COMMENT ON TABLE refresh_tokens      IS 'Tokens de refresco JWT activos';
