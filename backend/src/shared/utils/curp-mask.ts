/** Fragmento visible para entrenadores (ej. LOQE980130…). Sin CURP devuelve mensaje neutro. */
export function maskCurpFragment(curp: string | null | undefined): string {
  if (!curp || typeof curp !== 'string') return 'No registrada';
  const u = curp.toUpperCase().replace(/[^A-Z0-9Ñ]/g, '');
  if (u.length === 0) return 'No registrada';
  if (u.length <= 10) return `${u}…`;
  return `${u.slice(0, 10)}…`;
}
