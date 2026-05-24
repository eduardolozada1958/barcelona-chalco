/** Misma zona que el backend (WhatsApp y partidos). */
export const CLUB_TIMEZONE = 'America/Mexico_City';

const timeOpts: Intl.DateTimeFormatOptions = {
  timeZone: CLUB_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

export function formatMatchDateClub(iso: string | unknown): string {
  if (!iso) return '—';
  try {
    return new Date(String(iso)).toLocaleDateString('en-US', {
      timeZone: CLUB_TIMEZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase();
  } catch {
    return '—';
  }
}

export function formatMatchTimeClub(iso: string | unknown): string {
  if (!iso) return '—';
  try {
    return (
      new Date(String(iso)).toLocaleTimeString('es-MX', timeOpts) + ' HRS'
    );
  } catch {
    return '—';
  }
}

/** datetime-local en formulario admin (hora del club, no del navegador en otro país). */
export function isoToClubDatetimeLocal(iso: string | unknown): string {
  if (typeof iso !== 'string' || !iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: CLUB_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Valor mínimo para input datetime-local (hora actual del club). */
export function clubDatetimeLocalNow(): string {
  return isoToClubDatetimeLocal(new Date().toISOString());
}

/** Devuelve mensaje de error si la fecha/hora local del club ya pasó; null si está bien o vacío. */
export function validateClubDatetimeLocalNotPast(local: string, label = 'La fecha'): string | null {
  const trimmed = local.trim();
  if (!trimmed) return null;
  try {
    const iso = clubDatetimeLocalToIso(trimmed);
    if (new Date(iso).getTime() <= Date.now()) {
      return `${label} no puede ser en el pasado. Elige una fecha y hora futura (hora del club, México).`;
    }
  } catch {
    return 'Fecha u hora inválida';
  }
  return null;
}

/** Valor de datetime-local → ISO (interpretado como hora de México central). */
export function clubDatetimeLocalToIso(local: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!m) throw new Error('Fecha u hora inválida');
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00-06:00`;
}
