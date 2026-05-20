/** Frases motivadoras (español) — se elige una de forma estable por jugador + tipo. */

export const MVP_PHRASES = [
  '¡Felicidades, crack! Tu esfuerzo ilumina al equipo.',
  'MVP de la semana: disciplina, corazón y calidad en la cancha.',
  'Sigue así: el talento se nota, pero el trabajo te hace leyenda.',
  'Barcelona Cupido está orgulloso de ti. ¡A por más!',
  'Semana redonda: lideras con el ejemplo, no solo con el balón.',
  'El equipo confía en ti. Demuéstralo partido a partido.',
] as const;

export const TOP_SCORER_PHRASES = [
  '¡Goleador de la temporada! Cada gol cuenta una historia.',
  'La red te conoce bien: sigue persiguiendo la excelencia.',
  'Delantero con hambre de gol — el club te respalda.',
  'Tus goles inspiran a la academia. ¡No pares!',
  'Gol a gol construyes tu legado en Barcelona Cupido.',
  'La constancia en el área te pone arriba. ¡Felicidades!',
] as const;

export const TOP_SCORER_PODIUM_PHRASES = [
  'Entre los máximos goleadores del club. ¡Sigue sumando!',
  'Podio de goleo: tu nombre brilla en la tabla.',
  'Cada partido es oportunidad de escalar más arriba.',
] as const;

export function pickStablePhrase(phrases: readonly string[], seed: string): string {
  if (phrases.length === 0) return '';
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return phrases[hash % phrases.length] ?? phrases[0];
}
