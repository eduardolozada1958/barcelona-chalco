import { useQuery } from '@tanstack/react-query';

import { listUsers } from '@/api/users';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

export function DashboardUsersPage() {
  const q = useQuery({
    queryKey: ['users-admin'],
    queryFn: () => listUsers({ page: 1, limit: 50 }),
  });
  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Usuarios</h1>
        <span className="font-label-caps text-label-caps text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/20">
          {rows.length} registrados
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-low/50">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-container border-b border-outline-variant/20">
            <tr>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Usuario</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Rol</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const role = String(u.role);
              return (
                <tr key={String(u.id)} className="border-t border-outline-variant/10 hover:bg-surface-container/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/20">
                        <MaterialIcon name={role === 'admin' ? 'admin_panel_settings' : role === 'coach' ? 'sports' : 'person'} className="text-on-surface-variant" size={18} />
                      </div>
                      <span className="text-on-surface">{String(u.email)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps ${
                      role === 'admin' ? 'bg-error/15 text-error' :
                      role === 'coach' ? 'bg-primary/15 text-primary' :
                      'bg-secondary/15 text-secondary'
                    }`}>
                      {role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps ${
                      u.status === 'active' ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
                    }`}>
                      <MaterialIcon name={u.status === 'active' ? 'check_circle' : 'block'} size={12} />
                      {String(u.status)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
