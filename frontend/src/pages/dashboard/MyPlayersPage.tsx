import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { myPlayers } from '@/api/parents';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';
import { playerPublicPath } from '@/utils/player-path';

export function MyPlayersPage() {
  const q = useQuery({ queryKey: ['my-players'], queryFn: myPlayers });
  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as { isPrimaryContact?: boolean; player?: Record<string, unknown> }[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Mis Jugadores</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Jugadores vinculados a tu cuenta</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-stack-lg text-center bg-surface-container/30 rounded-xl border border-outline-variant/20">
          <MaterialIcon name="person_off" className="text-on-surface-variant mb-4" size={64} />
          <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Sin jugadores vinculados</p>
          <p className="font-body-md text-on-surface-variant">Contacta al administrador para vincular un jugador a tu cuenta.</p>
        </div>
      ) : (
        <div className="grid gap-gutter sm:grid-cols-2">
          {rows.map((row, i) => {
            const pl = row.player ?? {};
            const pid = String(pl.id ?? i);
            const primary = (row as { is_primary_contact?: boolean }).is_primary_contact ?? row.isPrimaryContact;
            return (
              <div key={pid} className="bg-[#002366]/20 backdrop-blur-md border border-primary/20 rounded-xl p-6 relative overflow-hidden group hover:border-primary/40 transition-all">
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/30 group-hover:scale-105 transition-transform">
                    <MaterialIcon name="person" className="text-primary" size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline-lg text-headline-lg-mobile text-on-surface truncate">
                      {String(pl.first_name)} {String(pl.last_name)}
                    </h3>
                    <p className="font-label-caps text-label-caps text-primary mt-1">{String(pl.category)}</p>
                    <div className="flex items-center gap-2 mt-3">
                      {primary && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps bg-primary/15 text-primary">
                          <MaterialIcon name="star" size={12} filled /> Contacto principal
                        </span>
                      )}
                    </div>
                    <Link to={playerPublicPath({ id: pid, slug: typeof pl.slug === 'string' ? pl.slug : null })} className="mt-4 inline-flex items-center gap-1 text-primary hover:underline font-label-caps text-label-caps">
                      <MaterialIcon name="visibility" size={14} /> Ver perfil público
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
