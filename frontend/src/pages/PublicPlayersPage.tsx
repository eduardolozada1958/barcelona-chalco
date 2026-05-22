import { useDeferredValue, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { listPlayersPublic } from '@/api/players';
import type { Player } from '@/types';
import { PlayerCard } from '@/components/PlayerCard';
import { FilterChips } from '@/components/FilterChips';
import { MaterialIcon } from '@/components/MaterialIcon';
import { SkeletonGrid } from '@/components/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/PageTransition';
import { playerPublicPath } from '@/utils/player-path';
import { playerMatchesSearch } from '@/utils/search-text';
import { prefetchPublicPlayer } from '@/utils/player-prefetch';
import { useDisplaySeason } from '@/hooks/useClubSettings';

const filterOptions = [
  { key: 'all',      label: 'Todos' },
  { key: 'active',   label: 'Activos' },
  { key: 'verified', label: 'Verificados' },
];

/**
 * Public players page – faithful translation of `jugadores.html` mockup.
 */
export function PublicPlayersPage() {
  const queryClient = useQueryClient();
  const displaySeason = useDisplaySeason();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const q = useQuery({
    queryKey: ['players-public-all'],
    queryFn: () => listPlayersPublic({ limit: 300, page: 1 }),
    staleTime: 60_000,
  });

  const allPlayers = (q.data?.data ?? []) as Player[];

  const players = useMemo(() => {
    return allPlayers.filter((p) => {
      if (filter === 'active' && p.status !== 'active') return false;
      if (filter === 'verified' && !p.is_verified) return false;
      return playerMatchesSearch(p, deferredSearch);
    });
  }, [allPlayers, filter, deferredSearch]);

  return (
    <div className="pt-12 pb-stack-lg px-margin-mobile md:px-margin-desktop w-full max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-stack-lg gap-stack-md">
        <div>
          <h1 className="font-display-hero text-display-hero text-on-surface mb-2">Nuestros Jugadores</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Explora el talento de élite de nuestro club. Identidades verificadas y estadísticas de rendimiento en tiempo real.
          </p>
        </div>
        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-base w-full lg:w-auto">
          <div className="relative flex-grow sm:w-64">
            <MaterialIcon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              type="text"
              placeholder="Buscar (ej. matias, dyl, mateo)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container border-b-2 border-outline-variant focus:border-primary text-on-surface font-body-md py-3 pl-10 pr-4 outline-none transition-colors duration-300 placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <FilterChips
        options={filterOptions}
        active={filter}
        onChange={setFilter}
        className="mb-stack-lg"
      />

      {/* Loading / Empty / Grid */}
      {q.isLoading ? (
        <SkeletonGrid count={6} type="player" />
      ) : players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-stack-lg text-center">
          <MaterialIcon name="person_off" className="text-on-surface-variant mb-4" size={64} />
          <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Sin resultados</p>
          <p className="font-body-md text-on-surface-variant">
            No se encontraron jugadores con los filtros actuales.
          </p>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
          {players.map((player) => (
            <StaggerItem key={player.id}>
              <Link
                to={playerPublicPath(player)}
                className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
                onMouseEnter={() => prefetchPublicPlayer(queryClient, player)}
                onFocus={() => prefetchPublicPlayer(queryClient, player)}
              >
                <PlayerCard player={player} displaySeason={displaySeason} />
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
