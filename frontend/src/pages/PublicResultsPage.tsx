import { useQuery } from '@tanstack/react-query';

import { listResultsPublic } from '@/api/results';
import type { Result } from '@/types';
import { ResultCard } from '@/components/ResultCard';
import { MaterialIcon } from '@/components/MaterialIcon';
import { SkeletonGrid } from '@/components/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/PageTransition';

/**
 * Public results page – faithful translation of `resultados.html` mockup.
 */
export function PublicResultsPage() {
  const q = useQuery({ queryKey: ['results-public'], queryFn: () => listResultsPublic() });
  const results = (q.data?.data ?? []) as Result[];

  return (
    <div className="pt-12 pb-16 px-margin-mobile md:px-margin-desktop w-full max-w-[1280px] mx-auto">
      {/* Header */}
      <header className="mb-stack-lg flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant/30 pb-stack-sm">
        <div>
          <h1 className="font-display-hero text-display-hero text-primary mb-2">RESULTADOS</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Los últimos resultados del campo de batalla. Rendimiento élite verificado.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
            <MaterialIcon name="filter_list" />
            <span className="font-label-caps text-label-caps">Filtrar</span>
          </button>
          <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
            <MaterialIcon name="sort" />
            <span className="font-label-caps text-label-caps">Ordenar</span>
          </button>
        </div>
      </header>

      {/* Grid */}
      {q.isLoading ? (
        <SkeletonGrid count={6} />
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-stack-lg text-center">
          <MaterialIcon name="scoreboard" className="text-on-surface-variant mb-4" size={64} />
          <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Sin resultados</p>
          <p className="font-body-md text-on-surface-variant">Aún no hay resultados registrados para esta temporada.</p>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {results.map((result) => (
            <StaggerItem key={result.id}>
              <ResultCard result={result} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
