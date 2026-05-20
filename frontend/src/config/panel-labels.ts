import type { SessionRole } from '@/contexts/AuthContext';

export function getPanelTitle(role: SessionRole | undefined): string {
  switch (role) {
    case 'admin':
      return 'Perfil administrador';
    case 'coach':
      return 'Perfil entrenador';
    case 'parent':
      return 'Perfil padre / tutor';
    default:
      return 'Mi cuenta';
  }
}

export function getPanelShortLabel(role: SessionRole | undefined): string {
  switch (role) {
    case 'admin':
      return 'Perfil admin';
    case 'coach':
      return 'Perfil coach';
    case 'parent':
      return 'Perfil padre';
    default:
      return 'Mi perfil';
  }
}

export function getPanelNavIcon(role: SessionRole | undefined): string {
  switch (role) {
    case 'parent':
      return 'family_restroom';
    case 'coach':
      return 'sports';
    default:
      return 'admin_panel_settings';
  }
}

export function getPanelHomeSubtitle(role: SessionRole | undefined): string {
  switch (role) {
    case 'admin':
      return 'Panel de administración del club: plantilla, resultados, avisos y usuarios.';
    case 'coach':
      return 'Panel del cuerpo técnico: plantilla, partidos, resultados y comunicados.';
    case 'parent':
      return 'Tu espacio de padre o tutor: hijos vinculados, partidos y avisos del club.';
    default:
      return 'Resumen de tu cuenta.';
  }
}
