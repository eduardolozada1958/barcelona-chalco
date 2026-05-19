/** Normaliza CURP mexicana: mayúsculas, sin espacios. */
export function normalizeCurp(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s/g, '');
}

export function isValidCurpFormat(curp: string): boolean {
  return /^[A-Z0-9Ñ]{18}$/.test(normalizeCurp(curp));
}
