/** Grupos de sede para tablas de goleo (debe coincidir con backend venue-groups). */
export const VENUE_LEADER_GROUPS = [
  {
    id: 'canchas100' as const,
    tabLabel: 'Canchas 100',
    title: 'Canchas 100',
    description: 'Goles y tarjetas de partidos publicados en Canchas 100.',
  },
  {
    id: 'walmart' as const,
    tabLabel: 'Cancha Walmart',
    title: 'Cancha Walmart',
    description: 'Goles y tarjetas de partidos publicados en Cancha Walmart.',
  },
] as const;

export type VenueLeaderGroupId = (typeof VENUE_LEADER_GROUPS)[number]['id'];

export const DEFAULT_VENUE_LEADER_ID: VenueLeaderGroupId = 'canchas100';
