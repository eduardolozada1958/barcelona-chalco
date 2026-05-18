import { supabaseAdmin } from '@config/database';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isPlayerUuid(ref: string): boolean {
  return UUID_RE.test(ref);
}

export function isPlayerSlug(ref: string): boolean {
  return SLUG_RE.test(ref) && ref.length <= 120;
}

export function slugifyPlayerName(firstName: string, lastName: string): string {
  const raw = `${firstName} ${lastName}`
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (raw.slice(0, 80) || 'jugador');
}

/** Asigna slug único; si existe homónimo usa -2, -3, … */
export async function allocateUniquePlayerSlug(
  firstName: string,
  lastName: string,
  excludePlayerId?: string,
): Promise<string> {
  const base = slugifyPlayerName(firstName, lastName);
  let candidate = base;
  let suffix = 2;

  for (;;) {
    let query = supabaseAdmin
      .from('players')
      .select('id')
      .eq('slug', candidate)
      .is('deleted_at', null);

    if (excludePlayerId) query = query.neq('id', excludePlayerId);

    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return candidate;

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}
