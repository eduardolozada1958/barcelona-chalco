export interface PitchPlayer {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
}

export function rosterRowToPitchPlayer(row: Record<string, unknown>): PitchPlayer {
  const jn = row.jersey_number;
  return {
    id: String(row.id),
    firstName: String(row.first_name ?? ''),
    lastName: String(row.last_name ?? ''),
    jerseyNumber: jn != null && jn !== '' && !Number.isNaN(Number(jn)) ? Number(jn) : null,
  };
}

export function displayPlayerName(p: PitchPlayer): string {
  const n = `${p.firstName} ${p.lastName}`.trim();
  return n || 'Jugador';
}

export function displayPlayerShort(p: PitchPlayer): string {
  const full = displayPlayerName(p);
  if (full.length <= 14) return full;
  return `${p.firstName.charAt(0)}. ${p.lastName}`.trim();
}

export function slotsToPitchPlayers(
  slots: (string | null)[],
  roster: PitchPlayer[],
): (PitchPlayer | null)[] {
  const byId = new Map(roster.map((p) => [p.id, p]));
  return slots.map((id) => (id ? byId.get(id) ?? null : null));
}
