/** Texto en minúsculas sin acentos para comparar búsquedas (Matías → matias). */
export function normalizeSearchText(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
