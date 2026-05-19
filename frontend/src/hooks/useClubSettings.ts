import { useQuery } from '@tanstack/react-query';

import { getSettingsPublic } from '@/api/settings';

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
