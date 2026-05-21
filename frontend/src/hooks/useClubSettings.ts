import { useQuery } from '@tanstack/react-query';

import { getSettingsPublic } from '@/api/settings';
import { CURRENT_SEASON } from '@/config/club';

export interface ClubSettingsPublic {
  clubName?:        string;
  clubDescription?: string;
  season?:          string;
  primaryColor?:    string;
  contactEmail?:    string;
  contactPhone?:    string;
}

export function useClubSettings() {
  return useQuery({
    queryKey: ['settings-public'],
    queryFn: async () => {
      const res = await getSettingsPublic();
      if (!res.success || !res.data) return null;
      return res.data as ClubSettingsPublic;
    },
    staleTime: 5 * 60_000,
  });
}

/** Temporada visible en todo el sitio: Ajustes del club → constante por defecto. */
export function useDisplaySeason(): string {
  const q = useClubSettings();
  const fromSettings = q.data?.season?.trim();
  return fromSettings || CURRENT_SEASON;
}
