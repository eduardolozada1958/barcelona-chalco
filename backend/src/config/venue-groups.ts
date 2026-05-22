/** Ubicaciones de partidos agrupadas para tablas de goleo por sede. */
export const VENUE_GROUP_LOCATIONS = {
  canchas100: ['Canchas 100'],
  'walmart-atlas': ['Cancha Walmart', 'Cancha Atlas'],
} as const;

export type VenueLeaderGroup = keyof typeof VENUE_GROUP_LOCATIONS;

export function parseVenueLeaderGroup(raw: unknown): VenueLeaderGroup | null {
  if (raw === 'canchas100' || raw === 'walmart-atlas') return raw;
  return null;
}

export function matchLocationInVenueGroup(location: string, group: VenueLeaderGroup): boolean {
  const loc = location.trim().toLowerCase();
  return VENUE_GROUP_LOCATIONS[group].some((label) => loc === label.toLowerCase());
}
