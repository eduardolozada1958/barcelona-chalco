import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { getSeasonLeadersPublic, type SeasonLeaderRow } from '@/api/players';
import { MaterialIcon } from '@/components/MaterialIcon';

export type SeasonLeadersTablesProps = {
  /** Filas máximas por tabla (goleo y disciplina vienen por separado del API). */
  limit?: number;
  /** Ruta al detalle del jugador (público o panel). */
  getPlayerHref?: (playerId: string) => string;
  title?: string;
  description?: string;
  /** Ej. enlace a resultados del panel o a plantilla pública. */
  asideLink?: { to: string; label: string };
  /** Estilo acorde al dashboard (bordes más marcados). */
  variant?: 'public' | 'dashboard';
};

function leaderName(r: SeasonLeaderRow) {
  return `${r.first_name} ${r.last_name}`.trim();
}

/**
 * Tabla de goleo/asistencias y tabla de tarjetas (mismos datos que el inicio público).
 */
export function SeasonLeadersTables({
  limit = 12,
  getPlayerHref = (id) => `/jugadores/${id}`,
  title = '⚽ Tabla de goleo y tarjetas',
  description = 'Estadísticas acumuladas de jugadores verificados en partidos cuyo resultado ya está publicado. Se actualiza al registrar estadísticas por jugador en cada resultado.',
  asideLink,
  variant = 'public',
}: SeasonLeadersTablesProps) {
  const leadersQ = useQuery({
    queryKey: ['season-leaders-public', limit],
    queryFn: () => getSeasonLeadersPublic(limit),
  });

  const scoring = (leadersQ.data?.data?.scoring ?? []) as SeasonLeaderRow[];
  const discipline = (leadersQ.data?.data?.discipline ?? []) as SeasonLeaderRow[];

  const panelClass =
    variant === 'dashboard'
      ? 'rounded-xl border border-outline-variant/20 overflow-hidden bg-surface-container-low/40'
      : 'glass-panel rounded-xl border border-outline-variant/20 overflow-hidden';

  const headBarClass =
    variant === 'dashboard'
      ? 'px-4 py-3 bg-surface-container border-b border-outline-variant/20 flex items-center gap-2'
      : 'px-4 py-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center gap-2';

  return (
    <section className={variant === 'dashboard' ? 'mt-stack-lg pt-stack-lg border-t border-outline-variant/20' : ''}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-stack-md">
        <div>
          <h2
            className={
              variant === 'public'
                ? 'font-display-hero text-headline-lg text-primary'
                : 'font-headline-lg text-headline-lg text-primary'
            }
          >
            {title}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-2xl">{description}</p>
        </div>
        {asideLink ? (
          <Link to={asideLink.to} className="text-primary font-label-caps text-label-caps hover:underline shrink-0">
            {asideLink.label}
          </Link>
        ) : null}
      </div>

      {leadersQ.isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter animate-pulse">
          <div className="h-48 rounded-xl bg-surface-container-low border border-outline-variant/20" />
          <div className="h-48 rounded-xl bg-surface-container-low border border-outline-variant/20" />
        </div>
      ) : scoring.length === 0 && discipline.length === 0 ? (
        <div className={`${panelClass} p-stack-md text-center text-on-surface-variant font-body-md`}>
          Aún no hay estadísticas por jugador publicadas. Cuando registres goles y tarjetas en los resultados publicados,
          aparecerán aquí automáticamente.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
          <div className={panelClass}>
            <div className={headBarClass}>
              <MaterialIcon name="sports_soccer" className="text-primary" size={22} />
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Tabla de goleo</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-surface-container/50 text-on-surface-variant font-label-caps text-[10px] uppercase tracking-wide">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Jugador</th>
                    <th className="p-3 text-right">Goles</th>
                    <th className="p-3 text-right">Asist.</th>
                  </tr>
                </thead>
                <tbody>
                  {scoring.map((row, i) => (
                    <tr key={row.player_id} className="border-t border-outline-variant/10 hover:bg-surface-container/20">
                      <td className="p-3 text-on-surface-variant">{i + 1}</td>
                      <td className="p-3">
                        <Link
                          to={getPlayerHref(row.player_id)}
                          className="flex items-center gap-2 text-on-surface hover:text-primary"
                        >
                          {row.avatar_url ? (
                            <img src={row.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-outline-variant/30" />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
                              <MaterialIcon name="person" size={16} className="text-on-surface-variant" />
                            </span>
                          )}
                          <span className="font-medium">{leaderName(row)}</span>
                        </Link>
                      </td>
                      <td className="p-3 text-right font-stat-value text-primary">{row.goals}</td>
                      <td className="p-3 text-right text-on-surface-variant">{row.assists}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {scoring.length === 0 && (
              <p className="p-4 text-on-surface-variant text-sm">Sin goles registrados aún en resultados publicados.</p>
            )}
          </div>

          <div className={panelClass}>
            <div className={headBarClass}>
              <MaterialIcon name="style" className="text-secondary" size={22} />
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Tarjetas (disciplina)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-surface-container/50 text-on-surface-variant font-label-caps text-[10px] uppercase tracking-wide">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Jugador</th>
                    <th className="p-3 text-right">Amarillas</th>
                    <th className="p-3 text-right">Rojas</th>
                  </tr>
                </thead>
                <tbody>
                  {discipline.map((row, i) => (
                    <tr key={row.player_id} className="border-t border-outline-variant/10 hover:bg-surface-container/20">
                      <td className="p-3 text-on-surface-variant">{i + 1}</td>
                      <td className="p-3">
                        <Link
                          to={getPlayerHref(row.player_id)}
                          className="flex items-center gap-2 text-on-surface hover:text-primary"
                        >
                          {row.avatar_url ? (
                            <img src={row.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-outline-variant/30" />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
                              <MaterialIcon name="person" size={16} className="text-on-surface-variant" />
                            </span>
                          )}
                          <span className="font-medium">{leaderName(row)}</span>
                        </Link>
                      </td>
                      <td className="p-3 text-right text-yellow-500 font-medium">{row.yellow_cards}</td>
                      <td className="p-3 text-right text-error font-medium">{row.red_cards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {discipline.length === 0 && (
              <p className="p-4 text-on-surface-variant text-sm">Sin tarjetas registradas en resultados publicados.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
