// Constantes globales de la aplicación

export const ROLES = {
  ADMIN:  'admin',
  COACH:  'coach',
  PARENT: 'parent',
} as const;

export const PLAYER_CATEGORIES = [
  'Sub-11',
  'Sub-13',
  'Sub-15',
  'Sub-17',
  'Sub-20',
] as const;

export const PLAYER_POSITIONS = [
  'Portero',
  'Defensa Central',
  'Lateral Derecho',
  'Lateral Izquierdo',
  'Mediocampista Defensivo',
  'Mediocampista Central',
  'Mediocampista Ofensivo',
  'Extremo Derecho',
  'Extremo Izquierdo',
  'Segundo Delantero',
  'Delantero Centro',
] as const;

export const HTTP_STATUS = {
  OK:                    200,
  CREATED:               201,
  NO_CONTENT:            204,
  BAD_REQUEST:           400,
  UNAUTHORIZED:          401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  CONFLICT:              409,
  UNPROCESSABLE_ENTITY:  422,
  TOO_MANY_REQUESTS:     429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE:     1,
  DEFAULT_LIMIT:    20,
  MAX_LIMIT:        100,
} as const;

export const QR_TOKEN_BYTES = 32;

export const CURRENT_SEASON = '2024-2025';
