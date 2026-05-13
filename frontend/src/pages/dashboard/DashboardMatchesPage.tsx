import { useQuery } from '@tanstack/react-query';

import { listMatchesAdmin } from '@/api/matches';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

export function DashboardMatchesPage() {
  const q = useQuery({
    queryKey: ['matches-admin'],
    queryFn: () => listMatchesAdmin({ page: 1, limit: 40 }),
  });
  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Partidos</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Gestión de calendario deportivo</p>
        </div>
        <button className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2">
          <MaterialIcon name="add" size={18} /> Programar
        </button>
      </div>

      <div className="grid gap-stack-sm">
        {rows.map((m) => {
          const status = String(m.status);
          return (
            <div key={String(m.id)} className="bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-5 flex items-center justify-between hover:border-primary/30 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/10 group-hover:bg-primary/10 transition-colors">
                  <MaterialIcon name="sports_soccer" className="text-primary" />
                </div>
                <div>
                  <h3 className="font-headline-lg-mobile text-body-lg text-on-surface font-semibold">{String(m.title)}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1"><MaterialIcon name="event" size={14} /> {String(m.match_date).slice(0, 10)}</span>
                    <span className="flex items-center gap-1"><MaterialIcon name="location_on" size={14} /> {String(m.location || '—')}</span>
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-label-caps ${
                status === 'scheduled' ? 'bg-secondary/15 text-secondary' :
                status === 'completed' ? 'bg-primary/15 text-primary' :
                'bg-surface-variant text-on-surface-variant'
              }`}>
                <MaterialIcon name={status === 'completed' ? 'check_circle' : 'schedule'} size={12} />
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
