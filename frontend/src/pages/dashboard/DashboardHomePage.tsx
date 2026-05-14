import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats } from '@/api/dashboard';
import { listMatchesAdmin } from '@/api/matches';
import { MaterialIcon } from '@/components/MaterialIcon';
import { Spinner } from '@/components/Spinner';
import { DashboardModal } from '@/components/DashboardModal';

const quickActions = [
  { icon: 'person_add',    label: 'Agregar Jugador',       to: '/dashboard/players?crear=1' },
  { icon: 'sports_score',  label: 'Crear Partido',         to: '/dashboard/matches?crear=1' },
  { icon: 'edit_document', label: 'Registrar Resultado', to: '/dashboard/results?crear=1' },
  { icon: 'campaign',      label: 'Crear Aviso',           to: '/dashboard/notices?crear=1' },
];

function formatDayLabel(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso.slice(0, 16);
  }
}

export function DashboardHomePage() {
  const { user } = useAuth();
  const [dayOpen, setDayOpen] = useState(false);
  const isCoachOrAdmin = user?.role === 'admin' || user?.role === 'coach';

  const statsQ = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    enabled: Boolean(isCoachOrAdmin),
  });

  const matchesSummaryQ = useQuery({
    queryKey: ['matches-admin', 'home-summary'],
    queryFn: () => listMatchesAdmin({ page: 1, limit: 120 }),
    enabled: dayOpen && Boolean(isCoachOrAdmin),
  });

  const { todayMatches, tomorrowMatches } = useMemo(() => {
    const rows = (matchesSummaryQ.data?.data ?? []) as Record<string, unknown>[];
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const tom = new Date(today);
    tom.setDate(tom.getDate() + 1);
    const tomStr = `${tom.getFullYear()}-${pad(tom.getMonth() + 1)}-${pad(tom.getDate())}`;
    const todayM = rows.filter((r) => String(r.match_date).slice(0, 10) === todayStr);
    const tomorrowM = rows.filter((r) => String(r.match_date).slice(0, 10) === tomStr);
    return { todayMatches: todayM, tomorrowMatches: tomorrowM };
  }, [matchesSummaryQ.data]);

  const totalPlayers = statsQ.data?.success ? String(statsQ.data.data?.totalPlayers ?? '—') : statsQ.isLoading ? '…' : '—';
  const verified = statsQ.data?.success ? statsQ.data.data?.verifiedPlayers ?? 0 : 0;
  const total = statsQ.data?.success ? statsQ.data.data?.totalPlayers ?? 0 : 0;
  const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;
  const newMonth = statsQ.data?.success ? statsQ.data.data?.newPlayersThisMonth ?? 0 : 0;
  const pending = statsQ.data?.success ? String(statsQ.data.data?.pendingInscriptions ?? '—') : statsQ.isLoading ? '…' : '—';

  return (
    <div className="flex flex-col gap-stack-lg">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-sm border-b border-outline-variant/20 pb-stack-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background tracking-tight">
            Bienvenido{user?.fullName ? `, ${user.fullName}` : ''}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Resumen del estado actual y operaciones del club.
          </p>
        </div>
        {isCoachOrAdmin && (
          <button
            type="button"
            onClick={() => setDayOpen(true)}
            className="flex items-center gap-base text-primary font-label-caps text-label-caps bg-surface-container-low px-4 py-2 rounded-full border border-primary/20 hover:border-primary/50 transition-colors self-start md:self-auto"
          >
            <MaterialIcon name="calendar_month" size={18} />
            <span>Resumen del Día</span>
          </button>
        )}
      </header>

      {isCoachOrAdmin && (
        <section>
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-stack-sm tracking-widest">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-base md:gap-gutter">
            {quickActions.map((a) => (
              <Link
                key={a.icon}
                to={a.to}
                className="group flex flex-col items-center justify-center gap-stack-sm p-stack-md bg-surface-container/40 backdrop-blur-sm border border-outline-variant/30 rounded-xl hover:bg-surface-container hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <MaterialIcon name={a.icon} className="text-primary group-hover:drop-shadow-[0_0_8px_rgba(242,202,80,0.6)] transition-all" />
                </div>
                <span className="font-label-caps text-label-caps text-on-surface group-hover:text-primary transition-colors text-center">{a.label}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {isCoachOrAdmin && (
        <section>
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-stack-sm tracking-widest">Métricas Clave</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <MetricCard
              icon="groups_2"
              label="Total Jugadores"
              value={totalPlayers}
              sub={newMonth > 0 ? `+${newMonth} este mes` : '+0 este mes'}
              color="primary"
            />
            <MetricCard
              icon="verified_user"
              label="Jugadores Verificados"
              value={statsQ.isLoading ? '…' : String(verified)}
              progress={verifiedPct}
              color="primary"
            />
            <MetricCard
              icon="pending_actions"
              label="Solicitudes Pendientes"
              value={pending}
              color="error"
              actionLabel="Ver Todas"
              actionTo="/dashboard/inscriptions"
            />
          </div>
        </section>
      )}

      {user?.role === 'parent' && (
        <section>
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-stack-sm tracking-widest">Acceso Rápido</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
            <DashCard to="/dashboard/mis-jugadores" icon="family_restroom" title="Mis Jugadores" desc="Perfil y estadísticas de tus hijos." />
            <DashCard to="/partidos" icon="calendar_today" title="Próximos Partidos" desc="Horarios, sedes y convocatorias." />
            <DashCard to="/avisos" icon="campaign" title="Avisos del Club" desc="Comunicados y actualizaciones." />
          </div>
        </section>
      )}

      <DashboardModal open={dayOpen} onClose={() => setDayOpen(false)} title="Resumen del día" wide>
        {matchesSummaryQ.isLoading ? (
          <Spinner />
        ) : (
          <div className="space-y-stack-md text-on-surface">
            <div>
              <h4 className="font-label-caps text-label-caps text-primary mb-2">Hoy</h4>
              {todayMatches.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Sin partidos programados para hoy.</p>
              ) : (
                <ul className="space-y-2">
                  {todayMatches.map((m) => (
                    <li key={String(m.id)} className="text-sm border border-outline-variant/20 rounded-lg p-3 bg-surface-container/30">
                      <span className="font-medium">{String(m.title)}</span>
                      <span className="text-on-surface-variant block text-xs mt-1">{formatDayLabel(String(m.match_date))} · {String(m.location ?? '')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="font-label-caps text-label-caps text-secondary mb-2">Mañana</h4>
              {tomorrowMatches.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Sin partidos para mañana.</p>
              ) : (
                <ul className="space-y-2">
                  {tomorrowMatches.map((m) => (
                    <li key={String(m.id)} className="text-sm border border-outline-variant/20 rounded-lg p-3 bg-surface-container/30">
                      <span className="font-medium">{String(m.title)}</span>
                      <span className="text-on-surface-variant block text-xs mt-1">{formatDayLabel(String(m.match_date))} · {String(m.location ?? '')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link to="/dashboard/matches" className="inline-flex items-center gap-2 text-primary font-label-caps text-label-caps hover:underline" onClick={() => setDayOpen(false)}>
              Ver calendario completo <MaterialIcon name="arrow_forward" size={14} />
            </Link>
          </div>
        )}
      </DashboardModal>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, progress, color, actionLabel, actionTo }: {
  icon: string; label: string; value: string; sub?: string; progress?: number; color: string;
  actionLabel?: string; actionTo?: string;
}) {
  const isError = color === 'error';
  return (
    <div className={`relative overflow-hidden bg-[#002366]/20 backdrop-blur-md border ${isError ? 'border-error/30' : 'border-primary/20'} rounded-xl p-stack-md shadow-lg flex flex-col justify-between`}>
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${isError ? 'bg-error/10' : 'bg-primary/10'} rounded-full blur-2xl pointer-events-none`} />
      <div className="flex justify-between items-start mb-stack-sm relative z-10">
        <h4 className="font-label-caps text-label-caps text-on-surface-variant">{label}</h4>
        <MaterialIcon name={icon} className={isError ? 'text-error/80' : 'text-primary/50'} />
      </div>
      <div className="relative z-10">
        <span className={`font-stat-value text-stat-value ${isError ? 'text-error' : 'text-primary'} block`}>{value}</span>
        {sub && <span className="font-body-md text-[14px] text-secondary mt-1 block">{sub}</span>}
        {progress !== undefined && (
          <div className="w-full bg-surface-variant h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {actionLabel && actionTo && (
          <Link to={actionTo} className="mt-3 inline-block bg-surface-variant hover:bg-surface-container-highest text-on-surface font-label-caps text-[10px] px-3 py-1.5 rounded-full border border-outline-variant/50 transition-colors">
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

function DashCard({ to, icon, title, desc }: { to: string; icon: string; title: string; desc: string }) {
  return (
    <Link to={to} className="group bg-surface-container/40 backdrop-blur-sm border border-outline-variant/30 rounded-xl p-stack-md hover:border-primary/50 hover:bg-surface-container transition-all duration-300">
      <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
        <MaterialIcon name={icon} className="text-primary" />
      </div>
      <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant text-sm">{desc}</p>
    </Link>
  );
}
