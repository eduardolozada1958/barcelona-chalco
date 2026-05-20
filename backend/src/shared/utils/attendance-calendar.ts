/** Días con actividad: L/M/V/S = partido; M/J = entrenamiento. Domingo sin sesión. */
export type SessionDayType = 'match' | 'training';

export function sessionTypeForDate(isoDate: string): SessionDayType | null {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const dow = d.getDay();
  if (dow === 1 || dow === 3 || dow === 5 || dow === 6) return 'match';
  if (dow === 2 || dow === 4) return 'training';
  return null;
}

export function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function parsePeriodMonth(raw: string): { year: number; month: number; iso: string } {
  const m = raw.match(/^(\d{4})-(\d{2})/);
  if (!m) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return { year, month, iso: firstDayOfMonth(year, month) };
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  return { year, month, iso: firstDayOfMonth(year, month) };
}

/** Fechas del mes que tienen sesión (lun–sáb según calendario del club). */
export function sessionDatesInMonth(year: number, month: number): { date: string; type: SessionDayType }[] {
  const out: { date: string; type: SessionDayType }[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const type = sessionTypeForDate(iso);
    if (type) out.push({ date: iso, type });
  }
  return out;
}

export function currentPeriodMonthIso(): string {
  const now = new Date();
  return firstDayOfMonth(now.getFullYear(), now.getMonth() + 1);
}
