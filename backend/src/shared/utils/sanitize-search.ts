import { normalizeSearchText } from './search-text';

/**
 * Sanitiza términos para filtros PostgREST `.or()` / `ilike`.
 * Evita inyección de operadores (coma, paréntesis, comodines arbitrarios).
 */
export function sanitizeIlikeSearchTerm(
  raw: string | undefined,
  opts?: { minLength?: number },
): string | undefined {
  const minLen = opts?.minLength ?? 2;
  if (raw == null) return undefined;
  const trimmed = raw.trim().slice(0, 80);
  if (!trimmed) return undefined;
  const safe = trimmed
    .replace(/[%_(),.\\'";\-<>=]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const normalized = normalizeSearchText(safe);
  if (!normalized || normalized.length < minLen) return undefined;
  if (!/[a-z0-9]/.test(normalized)) return undefined;
  if (/^(or|and|select|union|drop|delete)\b/.test(normalized)) {
    return undefined;
  }
  return normalized;
}

export function buildIlikeOrFilter(fields: readonly string[], search: string): string {
  const term = sanitizeIlikeSearchTerm(search);
  if (!term) return '';
  return fields.map((f) => `${f}.ilike.%${term}%`).join(',');
}

export function buildPlayerNameIlikeFilter(search: string): string {
  const term = sanitizeIlikeSearchTerm(search);
  if (!term) return '';
  // search_key (unaccent) cuando existe en BD; fallback a nombre/apellido
  return [
    `search_key.ilike.%${term}%`,
    ...['first_name', 'last_name'].map((f) => `${f}.ilike.%${term}%`),
  ].join(',');
}
