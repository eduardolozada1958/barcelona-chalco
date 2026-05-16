import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { listResultsAdmin } from '@/api/results';
import { listMatchesAdmin } from '@/api/matches';
import { MaterialIcon } from '@/components/MaterialIcon';
import { Spinner } from '@/components/Spinner';

/**
 * En Plantilla: atajo a editar goles/tarjetas por partido (modal en Resultados).
 */
export function MatchStatsQuickEdit() {
  const resultsQ = useQuery({
    queryKey: ['results-admin', 'quick-edit'],
    queryFn: () => listResultsAdmin({ page: 1, limit: 50 }),
  });
  const matchesQ = useQuery({
    queryKey: ['matches-admin', 'quick-edit'],
    queryFn: () => listMatchesAdmin({ page: 1, limit: 200 }),
  });

  const matchTitleById = new Map<string, string>();
  for (const m of (matchesQ.data?.data ?? []) as Record<string, unknown>[]) {
    matchTitleById.set(String(m.id), String(m.title));
  }

  const published = ((resultsQ.data?.data ?? []) as Record<string, unknown>[]).filter((r) => r.published);

  return (
    <section className="mb-stack-lg rounded-xl border border-primary/35 bg-primary/5 p-stack-md">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary flex items-center gap-2">
            <MaterialIcon name="sports_soccer" size={22} />
            Goles, asistencias y tarjetas por partido
          </h2>
          <ol className="mt-3 space-y-2 text-sm text-on-surface-variant list-decimal list-inside">
            <li>
              Ve a <strong className="text-on-surface">Resultados</strong> (menú izquierdo) o usa los botones de abajo.
            </li>
            <li>
              Pulsa <strong className="text-primary">Goles y tarjetas</strong> en el partido correspondiente.
            </li>
            <li>
              En el modal, baja a <strong className="text-on-surface">Estadísticas por jugador</strong>: pon goles, asistencias, 🟨 o 🟥.
              Para un <strong className="text-on-surface">nuevo goleador</strong>, ponle al menos 1 gol (o asistencia) y guarda.
            </li>
            <li>
              Si el resultado estaba en borrador, pulsa <strong className="text-on-surface">Publicar</strong> para que cuente en esta tabla.
            </li>
          </ol>
        </div>
        <Link
          to="/dashboard/results"
          className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps hover:shadow-[0_0_15px_rgba(212,175,55,0.35)]"
        >
          <MaterialIcon name="leaderboard" size={18} />
          Ir a Resultados
        </Link>
      </div>

      {resultsQ.isLoading || matchesQ.isLoading ? (
        <div className="mt-4">
          <Spinner />
        </div>
      ) : published.length === 0 ? (
        <p className="mt-4 text-sm text-on-surface-variant">
          Aún no hay resultados publicados. Registra un resultado en Resultados, carga las estadísticas y publícalo.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {published.slice(0, 6).map((r) => {
            const title = matchTitleById.get(String(r.match_id)) ?? 'Partido';
            return (
              <li
                key={String(r.id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-low/60 px-3 py-2"
              >
                <span className="text-sm text-on-surface truncate">
                  {title}{' '}
                  <span className="text-primary font-stat-value">
                    {String(r.goals_scored)}-{String(r.goals_conceded)}
                  </span>
                </span>
                <Link
                  to={`/dashboard/results?edit=${String(r.id)}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-label-caps text-primary border border-primary/40 hover:bg-primary/10"
                >
                  <MaterialIcon name="edit" size={14} />
                  Goles y tarjetas
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
