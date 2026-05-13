/**
 * Constantes compartidas del frontend
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_PREFIX = '/api/v1';
export const API_URL = `${API_BASE_URL}${API_PREFIX}`;

// Rutas públicas
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/credencial',
];

// Rutas autenticadas
export const AUTH_ROUTES = {
  DASHBOARD:     '/dashboard',
  PLAYERS:       '/dashboard/players',
  MATCHES:       '/dashboard/matches',
  RESULTS:       '/dashboard/results',
  NOTICES:       '/dashboard/notices',
  GALLERY:       '/dashboard/gallery',
  INSCRIPTIONS:  '/dashboard/inscriptions',
  SETTINGS:      '/dashboard/settings',
  PROFILE:       '/profile',
};

// Roles
export const ROLES = {
  ADMIN:  'admin',
  COACH:  'coach',
  PARENT: 'parent',
};

// Categorías de jugadores
export const PLAYER_CATEGORIES = [
  'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20',
];

// Posiciones
export const PLAYER_POSITIONS = [
  'Portero',
  'Defensa Central',
  'Lateral Izquierdo',
  'Lateral Derecho',
  'Extremo Izquierdo',
  'Extremo Derecho',
  'Mediocampista',
  'Delantero',
];

// Estados
export const PLAYER_STATUS = {
  ACTIVE:                'active',
  INACTIVE:              'inactive',
  INJURED:               'injured',
  SUSPENDED:             'suspended',
  PENDING_VERIFICATION:  'pending_verification',
};

export const MATCH_STATUS = {
  SCHEDULED:    'scheduled',
  IN_PROGRESS:  'in_progress',
  COMPLETED:    'completed',
  CANCELLED:    'cancelled',
  POSTPONED:    'postponed',
};

// Colores de paleta
export const COLORS = {
  primary:    '#D4AF37',  // Dorado
  secondary:  '#0F3460',  // Azul oscuro
  dark:       '#1A1A2E',  // Negro
  success:    '#22C55E',
  warning:    '#F59E0B',
  danger:     '#EF4444',
  light:      '#F3F4F6',
};

// Paginación
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZES = [10, 20, 50];

// Timeouts
export const REQUEST_TIMEOUT = 30000; // 30 segundos
export const DEBOUNCE_TIME = 500; // 0.5 segundos

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN:   'accessToken',
  REFRESH_TOKEN:  'refreshToken',
  USER:           'user',
  LOCALE:         'locale',
  THEME:          'theme',
};

// Headers
export const HEADERS = {
  CONTENT_TYPE: 'application/json',
  ACCEPT:       'application/json',
};

// Club info
export const CLUB_INFO = {
  NAME:  'Academia FC Barcelona',
  CITY:  'Los Héroes Chalco, Edo. Méx.',
  SEASON: '2024-2025',
};
