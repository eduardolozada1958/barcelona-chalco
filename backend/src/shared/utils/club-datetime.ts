/** Zona del club (Chalco / CDMX). Misma hora en web, panel y WhatsApp. */
export const CLUB_TIMEZONE = process.env.CLUB_TIMEZONE?.trim() || 'America/Mexico_City';

export function formatClubDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString('es-MX', {
    timeZone: CLUB_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatClubTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleTimeString('es-MX', {
    timeZone: CLUB_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatClubDateTime(iso: string | Date): string {
  return `${formatClubDate(iso)} · ${formatClubTime(iso)}`;
}
