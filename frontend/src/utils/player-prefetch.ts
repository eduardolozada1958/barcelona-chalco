import type { QueryClient } from '@tanstack/react-query';

import { getPlayerPublic } from '@/api/players';
import type { ApiResponse } from '@/api/types';
import type { Player } from '@/types';

export function findCachedPublicPlayer(
  queryClient: QueryClient,
  ref: string,
): Player | undefined {
  const list = queryClient.getQueryData<ApiResponse<Player[]>>(['players-public-all']);
  const rows = list?.data ?? [];
  const key = ref.trim().toLowerCase();
  return rows.find(
    (p) => p.id === ref || (p.slug?.trim().toLowerCase() ?? '') === key,
  );
}

export function prefetchPublicPlayer(queryClient: QueryClient, player: Player): void {
  const ref = player.slug?.trim() || player.id;
  void queryClient.prefetchQuery({
    queryKey: ['player-public', ref],
    queryFn: () => getPlayerPublic(ref),
    staleTime: 5 * 60_000,
  });
}
