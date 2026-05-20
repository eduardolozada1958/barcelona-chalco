/** Normaliza DATE/ISO de Postgres a YYYY-MM-DD (evita desfase UTC en clientes). */
export function normalizeBirthDateOutput(value: unknown): string | null {
  if (value == null || value === '') return null;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return String(value);
}
