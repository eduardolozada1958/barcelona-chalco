export const MATCH_STATUS_LABELS: Record<string, string> = {
  scheduled:   'Programado',
  in_progress: 'En juego',
  completed:   'Finalizado',
  cancelled:   'Cancelado',
  postponed:   'Aplazado',
};

export function matchStatusLabel(status: string | undefined | null): string {
  if (!status) return '—';
  return MATCH_STATUS_LABELS[status] ?? status;
}

export const NOTICE_TYPE_LABELS: Record<string, string> = {
  general:         'General',
  urgent:          'Urgente',
  event:           'Evento',
  training:        'Entrenamiento',
  match:           'Partido',
  administrative:  'Administrativo',
};

export function noticeTypeLabel(type: string | undefined | null): string {
  if (!type) return 'General';
  return NOTICE_TYPE_LABELS[type] ?? type;
}

export const USER_ROLE_LABELS: Record<string, string> = {
  admin:  'Administrador',
  coach:  'Entrenador',
  parent: 'Padre',
};

export function userRoleLabel(role: string | undefined | null): string {
  if (!role) return '—';
  return USER_ROLE_LABELS[role] ?? role;
}

export const USER_STATUS_LABELS: Record<string, string> = {
  active:    'Activo',
  inactive:  'Inactivo',
  suspended: 'Suspendido',
  pending:   'Pendiente',
};

export function userStatusLabel(status: string | undefined | null): string {
  if (!status) return '—';
  return USER_STATUS_LABELS[status] ?? status;
}

export const PLAYER_STATUS_LABELS: Record<string, string> = {
  active:   'Activo',
  inactive: 'Inactivo',
};

export function playerStatusLabel(status: string | undefined | null): string {
  if (!status) return '—';
  return PLAYER_STATUS_LABELS[status] ?? status;
}
