/** Grupos de sede para tablas de goleo (debe coincidir con backend venue-groups). */
export const VENUE_LEADER_GROUPS = {
  canchas100: {
    id: 'canchas100' as const,
    title: 'Canchas 100',
    description: 'Partidos en Canchas 100',
  },
  'walmart-atlas': {
    id: 'walmart-atlas' as const,
    title: 'Walmart y Atlas',
    description: 'Partidos en Cancha Walmart y Cancha Atlas',
  },
} as const;

export type VenueLeaderGroupId = keyof typeof VENUE_LEADER_GROUPS;
