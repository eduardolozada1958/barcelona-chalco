import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getMvpOfWeekPublic, getSeasonLeadersPublic } from '@/api/players';

export type PlayerHighlightKind = 'mvp' | 'top_scorer' | 'top_scorer_podium' | null;

export interface PlayerHighlights {
  kind: PlayerHighlightKind;
  loading: boolean;
  weekLabel: string | null;
  goals: number | null;
  scorerRank: number | null;
}

function matchesPlayer(
  playerId: string,
  slug: string | undefined,
  rowId: string,
  rowSlug?: string | null,
): boolean {
  if (rowId === playerId) return true;
  const s = slug?.trim();
  const rs = rowSlug?.trim();
  return Boolean(s && rs && s === rs);
}

export function usePlayerHighlights(playerId: string | undefined, slug?: string | null): PlayerHighlights {
  const mvpQ = useQuery({
    queryKey: ['mvp-of-week-public'],
    queryFn: getMvpOfWeekPublic,
    staleTime: 60_000,
  });

  const leadersQ = useQuery({
    queryKey: ['season-leaders-public', 8],
    queryFn: () => getSeasonLeadersPublic(8),
    staleTime: 60_000,
  });

  return useMemo(() => {
    const loading = mvpQ.isLoading || leadersQ.isLoading;
    if (!playerId) {
      return { kind: null, loading, weekLabel: null, goals: null, scorerRank: null };
    }

    const mvp = mvpQ.data?.data;
    const isMvp =
      Boolean(mvp?.playerId) &&
      (mvp!.playerId === playerId ||
        matchesPlayer(playerId, slug ?? undefined, mvp!.playerId!, mvp?.player?.slug));

    const scoring = leadersQ.data?.data?.scoring ?? [];
    const rank = scoring.findIndex((r) =>
      matchesPlayer(playerId, slug ?? undefined, r.player_id, r.slug),
    );
    const row = rank >= 0 ? scoring[rank] : null;
    const goals = row?.goals ?? null;

    if (isMvp) {
      return {
        kind: 'mvp',
        loading,
        weekLabel: mvp?.weekLabel ?? null,
        goals,
        scorerRank: rank >= 0 ? rank + 1 : null,
      };
    }

    if (rank === 0 && (goals ?? 0) > 0) {
      return {
        kind: 'top_scorer',
        loading,
        weekLabel: null,
        goals,
        scorerRank: 1,
      };
    }

    if (rank > 0 && rank < 3 && (goals ?? 0) > 0) {
      return {
        kind: 'top_scorer_podium',
        loading,
        weekLabel: null,
        goals,
        scorerRank: rank + 1,
      };
    }

    return { kind: null, loading, weekLabel: null, goals, scorerRank: rank >= 0 ? rank + 1 : null };
  }, [playerId, slug, mvpQ.data, mvpQ.isLoading, leadersQ.data, leadersQ.isLoading]);
}
