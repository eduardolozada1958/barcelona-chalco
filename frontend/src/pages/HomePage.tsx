import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { MaterialIcon } from '@/components/MaterialIcon';
import { SeasonLeadersTables } from '@/components/SeasonLeadersTables';
import { latestResultPublic } from '@/api/results';
import { listMatchesPublic } from '@/api/matches';
import { listNoticesPublic } from '@/api/notices';
import type { Result, Match, Notice } from '@/types';

/* ─── Hero placeholder image (cinematic stadium) ─── */
const HERO_IMAGE = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80&auto=format&fit=crop';

/**
 * Home Page – faithful translation of `home.html` mockup.
 * Sections: Hero → "¿Para qué sirve Barcelona Cupido?" → Info Cards → Highlights Bento Grid → Footer.
 */
export function HomePage() {
  // Fetch real data for highlights
  const latestResult = useQuery({ queryKey: ['latest-result'], queryFn: latestResultPublic });
  const matchesQ = useQuery({ queryKey: ['matches-public'], queryFn: () => listMatchesPublic() });
  const noticesQ = useQuery({ queryKey: ['notices-public'], queryFn: () => listNoticesPublic() });

  const latest = latestResult.data?.data as Result | undefined;
  const nextMatch = (matchesQ.data?.data as Match[] | undefined)?.[0];
  const urgentNotice = (noticesQ.data?.data as Notice[] | undefined)?.find((n) => n.type === 'urgent')
    ?? (noticesQ.data?.data as Notice[] | undefined)?.[0];

  return (
    <>
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-margin-mobile md:px-margin-desktop py-stack-lg overflow-hidden">
        {/* Background image + overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_IMAGE}
            alt="Barcelona Cupido Hero – stadium"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-[1280px] mx-auto text-center flex flex-col items-center gap-stack-md">
          <img src="/images/logo.png" alt="F.C. Barcelona Cupido" className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-2xl mb-2" />
          <h1 className="font-display-hero text-display-hero text-primary tracking-tighter drop-shadow-2xl">
            F.C. BARCELONA CUPIDO
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Plantilla, resultados, avisos y credencial digital del club, reunidos en un solo lugar para padres, jugadores y el cuerpo técnico.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mt-8 w-full sm:w-auto px-4 sm:px-0">
            <Link
              to="/jugadores"
              className="bg-primary text-[#000000] font-label-caps text-label-caps px-8 py-4 rounded-full hover:shadow-gold transition-all shadow-lg text-center w-full sm:w-auto"
            >
              Ver Jugadores
            </Link>
            <Link
              to="/credencial"
              className="bg-transparent border-2 border-primary text-primary font-label-caps text-label-caps px-8 py-4 rounded-full hover:bg-primary/10 transition-all text-center w-full sm:w-auto"
            >
              Validar Jugador
            </Link>
            <Link
              to="/partidos"
              className="bg-secondary-container text-on-background font-label-caps text-label-caps px-8 py-4 rounded-full hover:bg-secondary-container/80 transition-all border border-outline-variant/30 text-center w-full sm:w-auto"
            >
              Ver Próximos Partidos
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ WHAT IS Barcelona Cupido ═══════════════════ */}
      <section className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg items-center">
          <div className="flex flex-col gap-stack-sm">
            <h2 className="font-headline-lg text-headline-lg text-primary">¿Para qué sirve Barcelona Cupido?</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Barcelona Cupido es la plataforma web del club: un solo espacio para comprobar la identidad digital de los jugadores, revisar estadísticas de los partidos cuando ya hay resultado publicado y leer los avisos oficiales en cuanto los publica la directiva o el cuerpo técnico.
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant">
              El objetivo es que todos vean la misma información, con datos claros, trámites ordenados y comunicados que no se pierden entre chats o papeles sueltos.
            </p>
          </div>
          <div className="glass-panel p-stack-md rounded-xl relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all" />
            <div className="relative z-10 flex flex-col gap-4">
              {[
                { icon: 'qr_code_scanner', text: 'Verificación Instantánea' },
                { icon: 'monitoring',       text: 'Analíticas de Rendimiento' },
                { icon: 'security',         text: 'Identidad Segura' },
              ].map((item, i, arr) => (
                <div
                  key={item.icon}
                  className={`flex items-center gap-4 ${i < arr.length - 1 ? 'border-b border-outline-variant/30 pb-4' : ''}`}
                >
                  <MaterialIcon name={item.icon} className="text-primary" size={36} />
                  <span className="font-body-lg text-body-lg">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ INFO CARDS GRID ═══════════════════ */}
      <section className="px-margin-mobile md:px-margin-desktop py-stack-lg bg-surface-container-low/50">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {[
            { icon: 'qr_code',         title: 'Validar Jugadores con QR', desc: 'Escanea credenciales digitales al instante.',    to: '/credencial' },
            { icon: 'sports_soccer',    title: 'Consultar Partidos',       desc: 'Próximos partidos, horarios y sedes.',           to: '/partidos' },
            { icon: 'campaign',         title: 'Ver Avisos Oficiales',     desc: 'Comunicados y actualizaciones del club.',        to: '/avisos' },
            { icon: 'contact_support',  title: 'Contacto',  desc: 'Más información con el entrenador Gabo por teléfono o WhatsApp.',                 to: '/contacto' },
          ].map((card) => (
            <Link
              key={card.icon}
              to={card.to}
              className="glass-panel p-stack-md rounded-xl flex flex-col items-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center border border-primary/30">
                <MaterialIcon name={card.icon} className="text-primary" size={28} />
              </div>
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{card.title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm">{card.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-[1280px] mx-auto border-t border-outline-variant/20">
        <SeasonLeadersTables
          variant="public"
          asideLink={{ to: '/jugadores', label: 'Ver plantilla →' }}
        />
      </section>

      {/* ═══════════════════ HIGHLIGHTS BENTO GRID ═══════════════════ */}
      <section className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-[1280px] mx-auto">
        <h2 className="font-display-hero text-headline-lg text-primary mb-stack-md">Lo Destacado</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter auto-rows-[200px] md:auto-rows-[250px]">

          {/* Next Match (2-col span) */}
          <div className="md:col-span-2 glass-panel rounded-xl p-stack-md flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=1200&q=80&auto=format&fit=crop"
              alt="Stadium"
              className="absolute inset-0 w-full h-full object-cover opacity-40 z-0"
            />
            <div className="relative z-20 flex justify-between items-start">
              <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full font-label-caps text-label-caps text-[10px]">
                Próximo Partido
              </span>
              {nextMatch ? (
                <div className="text-right">
                  <p className="font-label-caps text-label-caps text-on-surface">
                    {new Date(nextMatch.match_date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                  </p>
                  <p className="font-body-md text-on-surface-variant text-sm">
                    {new Date(nextMatch.match_date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} HRS
                  </p>
                </div>
              ) : (
                <p className="font-label-caps text-label-caps text-on-surface-variant">PRÓXIMAMENTE</p>
              )}
            </div>
            <div className="relative z-20 flex items-center justify-start gap-6 mt-auto">
              <div className="flex flex-col items-center">
                <img src="/images/logo.png" alt="B. Cupido" className="w-12 h-12 object-contain drop-shadow-lg" />
                <span className="font-label-caps text-label-caps mt-2">B. Cupido</span>
              </div>
              <span className="font-display-hero text-headline-lg-mobile text-on-surface-variant opacity-50">VS</span>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center border border-outline-variant">
                  <MaterialIcon name="shield" className="text-on-surface-variant" size={20} />
                </div>
                <span className="font-label-caps text-label-caps mt-2 text-on-surface-variant">
                  {nextMatch?.opponent_name || 'Por definir'}
                </span>
              </div>
            </div>
          </div>

          {/* MVP Spotlight */}
          <div className="glass-panel rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-surface-container-low z-0 flex items-center justify-center">
              <MaterialIcon name="emoji_events" className="text-surface-container-high" size={80} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
            <div className="relative z-20 h-full p-stack-md flex flex-col justify-end">
              <span className="text-primary font-label-caps text-label-caps tracking-widest text-[10px] mb-1">
                MVP DE LA SEMANA
              </span>
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                {latest?.featured_player_id ? 'MVP' : '—'}
              </h3>
            </div>
          </div>

          {/* Last Result */}
          <div className="glass-panel rounded-xl p-stack-md flex flex-col justify-center items-center text-center border-l-4 border-l-primary">
            <span className="font-label-caps text-label-caps text-on-surface-variant mb-4">Último Resultado</span>
            {latest ? (
              <div className="flex items-center gap-4">
                <span className="font-body-lg text-body-lg">B. Cupido</span>
                <span className="font-stat-value text-stat-value text-primary">
                  {latest.goals_scored} - {latest.goals_conceded}
                </span>
                <span className="font-body-lg text-body-lg text-on-surface-variant">
                  Rival
                </span>
              </div>
            ) : (
              <p className="font-body-md text-on-surface-variant">Sin resultados aún</p>
            )}
          </div>

          {/* Important Notice (2-col span) */}
          <div className="md:col-span-2 bg-error-container/20 border border-error/30 rounded-xl p-stack-md flex flex-col justify-center relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-error/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-error text-on-error font-label-caps text-[10px] px-2 py-1 rounded-sm">URGENTE</span>
              <MaterialIcon name="warning" className="text-error" />
            </div>
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
              {urgentNotice?.title || 'Sin avisos urgentes'}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {urgentNotice?.content
                ? urgentNotice.content.length > 200
                  ? urgentNotice.content.slice(0, 200) + '…'
                  : urgentNotice.content
                : 'Todos los avisos al día. Revisa la sección de noticias para más información.'}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
