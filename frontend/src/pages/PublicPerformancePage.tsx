import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { listPerformancePublic } from '@/api/performance';
import type { PerformanceReport } from '@/api/performance';
import { MaterialIcon } from '@/components/MaterialIcon';
import { Spinner } from '@/components/Spinner';
import { formatMatchDateClub } from '@/utils/club-datetime';

export function PublicPerformancePage() {
  const q = useQuery({
    queryKey: ['performance-public'],
    queryFn: () => listPerformancePublic({ page: 1, limit: 40 }),
    staleTime: 2 * 60_000,
  });

  const reports = (q.data?.data ?? []) as PerformanceReport[];

  if (q.isLoading) return <Spinner />;

  return (
    <div className="pt-4 pb-stack-lg px-margin-mobile md:px-margin-desktop max-w-[960px] mx-auto w-full">
      <header className="mb-stack-lg border-b border-outline-variant/30 pb-stack-sm text-center">
        <h1 className="font-display-hero text-display-hero text-primary mb-base">Análisis de rendimiento</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
          Informes generales del cuerpo técnico sobre avances y áreas de mejora por categoría.
        </p>
      </header>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-stack-lg text-center">
          <MaterialIcon name="insights" className="text-on-surface-variant mb-4" size={64} />
          <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Sin informes publicados</p>
          <p className="font-body-md text-on-surface-variant">Cuando el club publique un análisis, aparecerá aquí.</p>
        </div>
      ) : (
        <ul className="space-y-stack-sm">
          {reports.map((r) => (
            <li key={r.id}>
              <Link
                to={`/rendimiento/${r.id}`}
                className="block rounded-xl border border-outline-variant/25 bg-surface-container-low p-stack-sm hover:border-primary/40 hover:bg-surface-container transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-label-caps text-label-caps text-secondary mb-1">{r.category}</p>
                    <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{r.title}</h2>
                    <p className="font-body-sm text-on-surface-variant mt-1">
                      {formatMatchDateClub(r.reportDate)} · {r.entries.length} jugador{r.entries.length === 1 ? '' : 'es'}
                    </p>
                  </div>
                  <MaterialIcon name="chevron_right" className="text-primary shrink-0" size={28} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
