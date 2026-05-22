import type { Player } from '@/types';

export function normalizeSearchText(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Coincide sin acentos: mat → Matías, dyl → Dylan, mati → Mateo. */
export function playerMatchesSearch(player: Pick<Player, 'first_name' | 'last_name'>, query: string): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;
  if (q.length < 2) return true;

  const full = normalizeSearchText(`${player.first_name} ${player.last_name}`);
  const first = normalizeSearchText(player.first_name);
  const last = normalizeSearchText(player.last_name);

  if (full.includes(q) || first.includes(q) || last.includes(q)) return true;
  if (first.startsWith(q) || last.startsWith(q)) return true;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every((t) => full.includes(t) || first.includes(t) || last.includes(t));
  }

  return false;
}
