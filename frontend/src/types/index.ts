/**
 * Tipos compartidos del frontend
 * Sincronizados con backend (shared/types) y schema.sql
 * Los campos usan snake_case porque la API (Supabase) los devuelve así.
 */

// ── Enums alineados con schema.sql ────────────────────────────

export type UserRole   = 'admin' | 'coach' | 'parent';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export type PlayerStatus = 'active' | 'inactive' | 'injured' | 'suspended' | 'pending_verification';
export type PlayerFoot   = 'right' | 'left' | 'both';

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
export type MatchType   = 'league' | 'cup' | 'friendly' | 'tournament' | 'internal';
export type MatchOutcome = 'win' | 'loss' | 'draw';

export type ConvocatoryStatus = 'called' | 'confirmed' | 'declined' | 'absent';

export type NoticeType     = 'general' | 'urgent' | 'event' | 'training' | 'match' | 'administrative';
export type NoticeAudience = 'all' | 'parents' | 'players' | 'coaches' | 'specific_category';

export type GalleryPostType = 'match_day' | 'result' | 'featured_player' | 'training' | 'convocatory' | 'general' | 'achievement';
export type MediaType       = 'image' | 'video';

export type InscriptionStatus   = 'pending' | 'under_review' | 'approved' | 'rejected' | 'waitlist';
export type QrValidationResult  = 'valid' | 'invalid' | 'expired' | 'not_found';

// ── Modelos (snake_case — tal como los devuelve la API) ───────

export interface User {
  id:                string;
  email:             string;
  role:              UserRole;
  status:            UserStatus;
  full_name:         string;
  avatar_url:        string | null;
  phone:             string | null;
  last_login_at:     string | null;
  email_verified:    boolean;
  created_at:        string;
  updated_at:        string;
}

export interface Parent {
  id:                       string;
  user_id:                  string;
  first_name:               string;
  last_name:                string;
  phone_primary:            string;
  phone_secondary:          string | null;
  relationship:             string;
  occupation:               string | null;
  emergency_contact_name:   string | null;
  emergency_contact_phone:  string | null;
  notes:                    string | null;
  created_at:               string;
  updated_at:               string;
}

export interface Player {
  id:                  string;
  first_name:          string;
  last_name:           string;
  birth_date:          string;
  nationality:         string;
  position:            string;
  secondary_position:  string | null;
  jersey_number:       number | null;
  dominant_foot:       PlayerFoot;
  height_cm:           number | null;
  weight_kg:           number | null;
  category:            string;
  sport_description:   string | null;
  avatar_url:          string | null;
  status:              PlayerStatus;
  is_verified:         boolean;
  verified_at:         string | null;
  verified_by:         string | null;
  qr_token:            string | null;
  qr_generated_at:     string | null;
  /** Solo en respuestas admin; nunca en listados públicos. */
  curp:                string | null;
  season:              string;
  achievements:        string | null;
  notes:               string | null;
  created_at:          string;
  updated_at:          string;
}

/** Vista v_player_career_stats */
export interface PlayerCareerStats extends Pick<Player,
  'id' | 'first_name' | 'last_name' | 'position' | 'secondary_position' |
  'category' | 'jersey_number' | 'dominant_foot' | 'height_cm' | 'weight_kg' |
  'avatar_url' | 'status' | 'is_verified' | 'season'
> {
  matches_played:      number;
  total_goals:         number;
  total_assists:       number;
  total_yellow_cards:  number;
  total_red_cards:     number;
  total_minutes:       number;
  avg_rating:          number;
}

export interface Match {
  id:                string;
  title:             string;
  description:       string | null;
  opponent_name:     string;
  opponent_logo_url: string | null;
  match_date:        string;
  location:          string;
  location_maps_url: string | null;
  match_type:        MatchType;
  category:          string;
  status:            MatchStatus;
  is_home:           boolean;
  banner_url:        string | null;
  season:            string;
  created_by:        string;
  created_at:        string;
  updated_at:        string;
  formation_type?:   'football_7' | 'football_11' | null;
  starting_lineup?:  string[] | null;
}

export interface MatchConvocatory {
  id:            string;
  match_id:      string;
  player_id:     string;
  status:        ConvocatoryStatus;
  notes:         string | null;
  called_at:     string;
  responded_at:  string | null;
}

export interface Result {
  id:                  string;
  match_id:            string;
  goals_scored:        number;
  goals_conceded:      number;
  outcome:             MatchOutcome;
  match_report:        string | null;
  highlight_url:       string | null;
  featured_player_id:  string | null;
  published:           boolean;
  published_at:        string | null;
  created_by:          string;
  created_at:          string;
  updated_at:          string;
}

export interface PlayerStat {
  id:              string;
  result_id:       string;
  player_id:       string;
  goals:           number;
  assists:         number;
  yellow_cards:    number;
  red_cards:       number;
  minutes_played:  number;
  rating:          number | null;
  notes:           string | null;
  created_at:      string;
  updated_at:      string;
}

export interface Notice {
  id:               string;
  title:            string;
  content:          string;
  type:             NoticeType;
  audience:         NoticeAudience;
  target_category:  string | null;
  is_published:     boolean;
  published_at:     string | null;
  expires_at:       string | null;
  is_pinned:        boolean;
  cover_image_url:  string | null;
  created_by:       string;
  created_at:       string;
  updated_at:       string;
}

export interface GalleryPost {
  id:                 string;
  title:              string;
  caption:            string | null;
  type:               GalleryPostType;
  related_match_id:   string | null;
  related_player_id:  string | null;
  is_published:       boolean;
  published_at:       string | null;
  views_count:        number;
  likes_count:        number;
  is_featured:        boolean;
  season:             string;
  created_by:         string;
  gallery_media:      GalleryMedia[];
  created_at:         string;
  updated_at:         string;
}

export interface GalleryMedia {
  id:               string;
  post_id:          string;
  url:              string;
  type:             MediaType;
  thumbnail_url:    string | null;
  caption:          string | null;
  sort_order:       number;
  file_size_bytes:  number | null;
  width_px:         number | null;
  height_px:        number | null;
  created_at:       string;
}

export interface Inscription {
  id:                        string;
  parent_first_name:         string;
  parent_last_name:          string;
  parent_email:              string;
  parent_phone:              string;
  parent_relationship:       string;
  player_first_name:         string;
  player_last_name:          string;
  player_birth_date:         string;
  player_nationality:        string;
  player_position:           string;
  player_dominant_foot:      PlayerFoot;
  player_height_cm:          number | null;
  player_weight_kg:          number | null;
  player_category:           string;
  player_previous_club:      string | null;
  player_sport_description:  string | null;
  player_avatar_url:         string | null;
  status:                    InscriptionStatus;
  reviewed_by:               string | null;
  reviewed_at:               string | null;
  review_notes:              string | null;
  rejection_reason:          string | null;
  converted_player_id:       string | null;
  converted_at:              string | null;
  ip_address:                string | null;
  created_at:                string;
  updated_at:                string;
}

export interface ClubSettings {
  id:               string;
  club_name:        string;
  club_logo_url:    string | null;
  club_description: string | null;
  season:           string;
  primary_color:    string;
  secondary_color:  string;
  accent_color:     string;
  contact_email:    string | null;
  contact_phone:    string | null;
  contact_address:  string | null;
  website_url:      string | null;
  instagram_url:    string | null;
  facebook_url:     string | null;
  twitter_url:      string | null;
  is_active:        boolean;
  created_at:       string;
  updated_at:       string;
}

export interface QrValidation {
  id:            string;
  player_id:     string;
  qr_token:      string;
  result:        QrValidationResult;
  validated_at:  string;
  ip_address:    string | null;
  user_agent:    string | null;
}

// ── API Responses ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success:  boolean;
  message:  string;
  data?:    T;
  errors?:  ApiError[];
  meta?:    PaginationMeta;
}

export interface ApiError {
  field?:    string;
  message:   string;
  code?:     string;
}

export interface PaginationMeta {
  page:        number;
  limit:       number;
  total:       number;
  totalPages:  number;
  hasNext:     boolean;
  hasPrev:     boolean;
}

// ── Auth ──────────────────────────────────────────────────────

export interface AuthCredentials {
  email:     string;
  password:  string;
}

export interface RegisterParentPayload {
  email:          string;
  password:       string;
  fullName:       string;
  phone?:         string;
  firstName:      string;
  lastName:       string;
  phonePrimary:   string;
  relationship:   'padre' | 'madre' | 'tutor' | 'tutora' | 'abuelo' | 'abuela' | 'tio' | 'tia' | 'otro';
}

/** Lo que devuelve POST /auth/login y /auth/register */
export interface AuthResponse {
  accessToken:   string;
  refreshToken:  string;
  user: {
    id:        string;
    email:     string;
    role:      UserRole;
    fullName:  string;
    avatarUrl?: string;
  };
}

export interface TokenPayload {
  sub:    string;   // user id
  email:  string;
  role:   UserRole;
  iat:    number;
  exp:    number;
}

// ── Dashboard Summary (v_dashboard_summary) ───────────────────

export interface DashboardSummary {
  active_players:          number;
  pending_verifications:   number;
  pending_inscriptions:    number;
  upcoming_matches:        number;
  registered_parents:      number;
  published_notices:       number;
}

// ── Player Public Credential (v_player_public_credential) ─────

export interface PlayerPublicCredential extends Pick<Player,
  'id' | 'first_name' | 'last_name' | 'birth_date' | 'nationality' |
  'position' | 'secondary_position' | 'jersey_number' | 'dominant_foot' |
  'height_cm' | 'weight_kg' | 'category' | 'sport_description' |
  'avatar_url' | 'is_verified' | 'verified_at' | 'season' |
  'achievements' | 'qr_token'
> {
  career_goals:       number;
  career_assists:     number;
  career_matches:     number;
  career_avg_rating:  number;
  club_name:          string;
  club_logo_url:      string | null;
  club_season:        string;
  primary_color:      string;
  secondary_color:    string;
}
