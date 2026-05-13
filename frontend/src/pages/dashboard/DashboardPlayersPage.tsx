import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { listPlayersAdmin } from '@/api/players';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

export function DashboardPlayersPage() {
  const q = useQuery({
    queryKey: ['players-admin'],
    queryFn: () => listPlayersAdmin({ page: 1, limit: 50 }),
  });
  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Plantilla</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{rows.length} jugadores registrados</p>
        </div>
        <button className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <MaterialIcon name="person_add" size={18} /> Agregar
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-low/50">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-container border-b border-outline-variant/20">
            <tr>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Jugador</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Categoría</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Estado</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Verificado</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={String(p.id)} className="border-t border-outline-variant/10 hover:bg-surface-container/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/20">
                      <MaterialIcon name="person" className="text-on-surface-variant" size={18} />
                    </div>
                    <span className="font-medium text-on-surface">{String(p.first_name)} {String(p.last_name)}</span>
                  </div>
                </td>
                <td className="p-4 text-on-surface-variant">{String(p.category)}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps ${
                    p.status === 'active'
                      ? 'bg-primary/15 text-primary'
                      : 'bg-surface-variant text-on-surface-variant'
                  }`}>
                    <MaterialIcon name={p.status === 'active' ? 'check_circle' : 'pause_circle'} size={12} />
                    {String(p.status)}
                  </span>
                </td>
                <td className="p-4">
                  {p.is_verified ? (
                    <MaterialIcon name="verified" className="text-primary" size={20} filled />
                  ) : (
                    <MaterialIcon name="cancel" className="text-on-surface-variant/40" size={20} />
                  )}
                </td>
                <td className="p-4">
                  <Link to={`/dashboard/players/${p.id}`} className="text-primary hover:underline font-label-caps text-label-caps flex items-center gap-1">
                    <MaterialIcon name="visibility" size={14} /> Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
