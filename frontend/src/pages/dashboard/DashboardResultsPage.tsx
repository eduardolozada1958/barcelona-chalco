import { useQuery } from '@tanstack/react-query';

import { listResultsAdmin } from '@/api/results';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

export function DashboardResultsPage() {
  const q = useQuery({
    queryKey: ['results-admin'],
    queryFn: () => listResultsAdmin({ page: 1, limit: 40 }),
  });
  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Resultados</h1>
        <button className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2">
          <MaterialIcon name="add" size={18} /> Registrar
        </button>
      </div>

      <div className="grid gap-stack-sm">
        {rows.map((r) => (
          <div key={String(r.id)} className="bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/10">
                <MaterialIcon name="sports_score" className="text-primary" />
              </div>
              <div>
                <h3 className="text-on-surface font-semibold">Partido {String(r.match_id)}</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  Marcador: <span className="text-primary font-stat-value">{String(r.goals_scored)}-{String(r.goals_conceded)}</span>
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-label-caps ${
              r.published ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
            }`}>
              <MaterialIcon name={r.published ? 'visibility' : 'visibility_off'} size={12} />
              {r.published ? 'Publicado' : 'Borrador'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
