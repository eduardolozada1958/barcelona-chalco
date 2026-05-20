/** Encabezado de columna: día de la semana + fecha del mes + tipo de sesión. */
export function formatSessionColumnHeader(
  isoDate: string,
  type: 'match' | 'training',
): { lines: string[]; title: string } {
  const d = new Date(isoDate + 'T12:00:00');
  const weekdayRaw = d.toLocaleDateString('es-MX', { weekday: 'long' });
  const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
  const dateLine = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  const kind = type === 'match' ? 'Juego' : 'Entreno';
  const title = d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return { lines: [weekday, dateLine, kind], title };
}
