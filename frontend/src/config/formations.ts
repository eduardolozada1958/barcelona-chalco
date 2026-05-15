/** Posición en la cancha (% del contenedor; y crece hacia arriba = ataque). */
export interface FormationSlot {
  x: number;
  y: number;
  role: string;
}

/** Fútbol 7: 1-1-2-1-2 (portero abajo). */
export const FORMATION_F7: readonly FormationSlot[] = [
  { x: 50, y: 90, role: 'POR' },
  { x: 50, y: 70, role: 'DEF' },
  { x: 22, y: 52, role: 'LI' },
  { x: 78, y: 52, role: 'LD' },
  { x: 50, y: 38, role: 'MC' },
  { x: 28, y: 16, role: 'DEL' },
  { x: 72, y: 16, role: 'DEL' },
];

/** Fútbol 11: 4-4-2. */
export const FORMATION_F11: readonly FormationSlot[] = [
  { x: 50, y: 92, role: 'POR' },
  { x: 12, y: 74, role: 'LI' },
  { x: 37, y: 76, role: 'DFC' },
  { x: 63, y: 76, role: 'DFC' },
  { x: 88, y: 74, role: 'LD' },
  { x: 12, y: 48, role: 'MI' },
  { x: 37, y: 50, role: 'MC' },
  { x: 63, y: 50, role: 'MC' },
  { x: 88, y: 48, role: 'MD' },
  { x: 35, y: 18, role: 'DEL' },
  { x: 65, y: 18, role: 'DEL' },
];

export function getFormationSlots(formation: 'football_7' | 'football_11'): readonly FormationSlot[] {
  return formation === 'football_7' ? FORMATION_F7 : FORMATION_F11;
}

export function formationSlotCount(formation: 'football_7' | 'football_11'): number {
  return formation === 'football_7' ? 7 : 11;
}

/** Convierte array guardado en BD a casillas fijas (índice = posición táctica). */
export function lineupIdsToSlots(ids: string[], formation: 'football_7' | 'football_11'): (string | null)[] {
  const n = formationSlotCount(formation);
  const slots: (string | null)[] = Array(n).fill(null);
  ids.forEach((id, i) => {
    if (i < n) slots[i] = id;
  });
  return slots;
}

export function slotsToLineupIds(slots: (string | null)[]): string[] {
  return slots.filter((id): id is string => Boolean(id));
}
