// Tipos compartidos de la capa de dominio

// ── Respuesta API estándar ────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?:   T;
  errors?: ApiError[];
  meta?:   PaginationMeta;
}

export interface ApiError {
  field?:   string;
  message:  string;
  code?:    string;
}

export interface PaginationMeta {
  page:        number;
  limit:       number;
  total:       number;
  totalPages:  number;
  hasNext:     boolean;
  hasPrev:     boolean;
}

// ── Autenticación ─────────────────────────────────────────────
export type UserRole   = 'admin' | 'coach' | 'parent';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface JwtPayload {
  sub:      string;   // user id
  email:    string;
  role:     UserRole;
  iat?:     number;
  exp?:     number;
}

export interface AuthenticatedUser {
  id:       string;
  email:    string;
  role:     UserRole;
  fullName: string;
}

// ── Usuarios ──────────────────────────────────────────────────
export interface User {
  id:                      string;
  email:                   string;
  role:                    UserRole;
  status:                  UserStatus;
  fullName:                string;
  avatarUrl:               string | null;
  phone:                   string | null;
  lastLoginAt:             string | null;
  emailVerified:           boolean;
  createdAt:               string;
  updatedAt:               string;
}

// ── Padres ────────────────────────────────────────────────────
export interface Parent {
  id:                    string;
  userId:                string;
  firstName:             string;
  lastName:              string;
  phonePrimary:          string;
  phoneSecondary:        string | null;
  relationship:          string;
  occupation:            string | null;
  emergencyContactName:  string | null;
  emergencyContactPhone: string | null;
  notes:                 string | null;
  createdAt:             string;
  updatedAt:             string;
}

// ── Jugadores ─────────────────────────────────────────────────
export type PlayerStatus = 'active' | 'inactive' | 'injured' | 'suspended' | 'pending_verification';
export type PlayerFoot   = 'right' | 'left' | 'both';

export interface Player {
  id:                string;
  firstName:         string;
  lastName:          string;
  birthDate:         string;
  nationality:       string;
  position:          string;
  secondaryPosition: string | null;
  jerseyNumber:      number | null;
  dominantFoot:      PlayerFoot;
  heightCm:          number | null;
  weightKg:          number | null;
  category:          string;
  sportDescription:  string | null;
  avatarUrl:         string | null;
  status:            PlayerStatus;
  isVerified:        boolean;
  verifiedAt:        string | null;
  qrToken:           string | null;
  season:            string;
  achievements:      string | null;
  createdAt:         string;
  updatedAt:         string;
}

// ── Partidos ──────────────────────────────────────────────────
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
export type MatchType   = 'league' | 'cup' | 'friendly' | 'tournament' | 'internal';

export interface Match {
  id:              string;
  title:           string;
  description:     string | null;
  opponentName:    string;
  opponentLogoUrl: string | null;
  matchDate:       string;
  location:        string;
  locationMapsUrl: string | null;
  matchType:       MatchType;
  category:        string;
  status:          MatchStatus;
  isHome:          boolean;
  bannerUrl:       string | null;
  season:          string;
  createdBy:       string;
  createdAt:       string;
  updatedAt:       string;
}

// ── Resultados ────────────────────────────────────────────────
export type MatchOutcome = 'win' | 'loss' | 'draw';

export interface Result {
  id:              string;
  matchId:         string;
  goalsScored:     number;
  goalsConceded:   number;
  outcome:         MatchOutcome;
  matchReport:     string | null;
  highlightUrl:    string | null;
  featuredPlayer:  string | null;
  published:       boolean;
  publishedAt:     string | null;
  createdBy:       string;
  createdAt:       string;
  updatedAt:       string;
}

// ── Avisos ────────────────────────────────────────────────────
export type NoticeType     = 'general' | 'urgent' | 'event' | 'training' | 'match' | 'administrative';
export type NoticeAudience = 'all' | 'parents' | 'players' | 'coaches' | 'specific_category';

export interface Notice {
  id:             string;
  title:          string;
  content:        string;
  type:           NoticeType;
  audience:       NoticeAudience;
  targetCategory: string | null;
  isPublished:    boolean;
  publishedAt:    string | null;
  expiresAt:      string | null;
  isPinned:       boolean;
  coverImageUrl:  string | null;
  createdBy:      string;
  createdAt:      string;
  updatedAt:      string;
}

// ── Galería ───────────────────────────────────────────────────
export type GalleryPostType = 'match_day' | 'result' | 'featured_player' | 'training' | 'convocatory' | 'general' | 'achievement';

export interface GalleryPost {
  id:              string;
  title:           string;
  caption:         string | null;
  type:            GalleryPostType;
  relatedMatchId:  string | null;
  relatedPlayerId: string | null;
  isPublished:     boolean;
  publishedAt:     string | null;
  viewsCount:      number;
  likesCount:      number;
  isFeatured:      boolean;
  season:          string;
  media:           GalleryMedia[];
  createdAt:       string;
  updatedAt:       string;
}

export interface GalleryMedia {
  id:            string;
  postId:        string;
  url:           string;
  type:          'image' | 'video';
  thumbnailUrl:  string | null;
  caption:       string | null;
  sortOrder:     number;
}

// ── Inscripciones ─────────────────────────────────────────────
export type InscriptionStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'waitlist';

export interface Inscription {
  id:                    string;
  parentFirstName:       string;
  parentLastName:        string;
  parentEmail:           string;
  parentPhone:           string;
  parentRelationship:    string;
  playerFirstName:       string;
  playerLastName:        string;
  playerBirthDate:       string;
  playerNationality:     string;
  playerPosition:        string;
  playerDominantFoot:    PlayerFoot;
  playerHeightCm:        number | null;
  playerWeightKg:        number | null;
  playerCategory:        string;
  playerPreviousClub:    string | null;
  playerSportDescription: string | null;
  status:                InscriptionStatus;
  reviewNotes:           string | null;
  rejectionReason:       string | null;
  convertedPlayerId:     string | null;
  createdAt:             string;
  updatedAt:             string;
}

// ── Query helpers ─────────────────────────────────────────────
export interface PaginationQuery {
  page?:  number;
  limit?: number;
}

export interface SortQuery {
  sortBy?:    string;
  sortOrder?: 'asc' | 'desc';
}
