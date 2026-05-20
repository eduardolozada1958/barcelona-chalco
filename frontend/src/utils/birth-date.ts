/** Partes de calendario locales (sin zona horaria). */
export function parseBirthDateParts(iso: unknown): { year: number; month: number; day: number } | null {
  if (iso == null || iso === '') return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isFinite(year) || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** Valor para `<input type="date">`. */
export function birthDateToInputValue(iso: unknown): string {
  const p = parseBirthDateParts(iso);
  if (!p) return '';
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function formatBirthDateEs(iso: unknown): string {
  const p = parseBirthDateParts(iso);
  if (!p) return '—';
  const d = new Date(p.year, p.month - 1, p.day);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function calcAgeFromBirthDate(iso: unknown): number | null {
  const p = parseBirthDateParts(iso);
  if (!p) return null;
  const today = new Date();
  let age = today.getFullYear() - p.year;
  const m = today.getMonth() + 1 - p.month;
  if (m < 0 || (m === 0 && today.getDate() < p.day)) age -= 1;
  return age;
}

/** Fecha de nacimiento en formato ISO (YYYY-MM-DD) a partir de los 6 dígitos YYMMDD de la CURP. */
export function birthDateIsoFromCurp(curp: unknown): string | null {
  if (typeof curp !== 'string') return null;
  const c = curp.trim().toUpperCase().replace(/[^A-Z0-9Ñ]/g, '');
  if (c.length < 10) return null;
  const yymmdd = c.slice(4, 10);
  if (!/^\d{6}$/.test(yymmdd)) return null;
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  const dd = Number(yymmdd.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const year = yy <= 29 ? 2000 + yy : 1900 + yy;
  return `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}
