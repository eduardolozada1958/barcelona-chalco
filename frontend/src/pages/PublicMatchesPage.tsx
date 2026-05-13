import { useQuery } from '@tanstack/react-query';

import { listMatchesPublic } from '@/api/matches';
import type { Match } from '@/types';
import { MatchCard } from '@/components/MatchCard';
import { MaterialIcon } from '@/components/MaterialIcon';
import { SkeletonGrid } from '@/components/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/PageTransition';
import { useState } from 'react';

/**
 * Public matches page – faithful translation of `partidos.html` mockup.
 */
export function PublicMatchesPage() {
  const [tab, setTab] = useState<'upcoming' | 'played'>('upcoming');

  const q = useQuery({ queryKey: ['matches-public'], queryFn: () => listMatchesPublic() });
  const allMatches = (q.data?.data ?? []) as Match[];

  const matches = allMatches.filter((m) =>
    tab === 'upcoming'
      ? m.status === 'scheduled' || m.status === 'in_progress'
      : m.status === 'completed'
  );

  return (
    <div className="w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col gap-stack-lg">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md">
        <div>
          <h1 className="font-display-hero text-display-hero text-on-background mb-stack-sm">Partidos</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Sigue la trayectoria. Rendimiento élite en exhibición.
          </p>
        </div>
        {/* Tab switcher */}
        <div className="flex gap-stack-sm bg-surface-container p-1 rounded-lg border border-outline-variant/30">
          <button
            onClick={() => setTab('upcoming')}
            className={`px-6 py-2 rounded-md font-label-caps text-label-caps transition-colors ${
              tab === 'upcoming'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Próximos
          </button>
          <button
            onClick={() => setTab('played')}
            className={`px-6 py-2 rounded-md font-label-caps text-label-caps transition-colors ${
              tab === 'played'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Jugados
          </button>
        </div>
      </header>

      {/* Grid */}
      {q.isLoading ? (
        <SkeletonGrid count={4} />
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-stack-lg text-center">
          <MaterialIcon name="event_busy" className="text-on-surface-variant mb-4" size={64} />
          <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
            {tab === 'upcoming' ? 'Sin partidos programados' : 'Sin partidos jugados'}
          </p>
          <p className="font-body-md text-on-surface-variant">
            {tab === 'upcoming'
              ? 'Los próximos partidos aparecerán aquí cuando sean programados.'
              : 'Los resultados de partidos anteriores aparecerán aquí.'}
          </p>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
          {matches.map((match) => (
            <StaggerItem key={match.id}>
              <MatchCard match={match} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
