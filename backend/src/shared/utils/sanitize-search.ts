/**
 * Sanitiza términos para filtros PostgREST `.or()` / `ilike`.
 * Evita inyección de operadores (coma, paréntesis, comodines arbitrarios).
 */
export function sanitizeIlikeSearchTerm(raw: string | undefined): string | undefined {
  if (raw == null) return undefined;
  const trimmed = raw.trim().slice(0, 80);
  if (!trimmed) return undefined;
  const safe = trimmed
    .replace(/[%_(),.\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return safe.length > 0 ? safe : undefined;
}

export function buildIlikeOrFilter(fields: readonly string[], search: string): string {
  const term = sanitizeIlikeSearchTerm(search);
  if (!term) return '';
  return fields.map((f) => `${f}.ilike.%${term}%`).join(',');
}

export function buildPlayerNameIlikeFilter(search: string): string {
  return buildIlikeOrFilter(['first_name', 'last_name'], search);
}
