import { useQuery } from '@tanstack/react-query';

import { listNoticesAdmin } from '@/api/notices';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

export function DashboardNoticesPage() {
  const q = useQuery({
    queryKey: ['notices-admin'],
    queryFn: () => listNoticesAdmin({ page: 1, limit: 40 }),
  });
  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Avisos</h1>
        <button className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2">
          <MaterialIcon name="add" size={18} /> Crear aviso
        </button>
      </div>

      <div className="grid gap-stack-sm">
        {rows.map((n) => (
          <div key={String(n.id)} className="bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/10">
                <MaterialIcon name="campaign" className="text-primary" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-on-surface">{String(n.title)}</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">{String(n.notice_type || '—')}</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-label-caps ${
              n.is_published ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
            }`}>
              <MaterialIcon name={n.is_published ? 'public' : 'drafts'} size={12} />
              {n.is_published ? 'Publicado' : 'Borrador'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
