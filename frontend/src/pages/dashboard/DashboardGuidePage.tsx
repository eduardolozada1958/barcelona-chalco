import { Link } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { getPanelTitle } from '@/config/panel-labels';
import { MaterialIcon } from '@/components/MaterialIcon';

type Step = { title: string; body: string; to?: string; label?: string };

function GuideSection({
  id,
  icon,
  title,
  intro,
  steps,
}: {
  id: string;
  icon: string;
  title: string;
  intro: string;
  steps: Step[];
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-xl border border-outline-variant/25 bg-surface-container-low/60 p-stack-md">
      <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface flex items-center gap-2 mb-3">
        <MaterialIcon name={icon} className="text-primary" />
        {title}
      </h2>
      <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">{intro}</p>
      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-label-caps text-xs">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-on-surface">{s.title}</p>
              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{s.body}</p>
              {s.to && s.label ? (
                <Link to={s.to} className="inline-flex items-center gap-1 mt-2 text-primary text-sm font-label-caps hover:underline">
                  {s.label}
                  <MaterialIcon name="arrow_forward" size={14} />
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const PUBLIC_SITE_STEPS: Step[] = [
  {
    title: '¿Qué es el sitio público?',
    body: 'Es lo que ven familias y visitantes: inicio, jugadores, partidos, resultados, avisos, galería y contacto (WhatsApp / llamada al entrenador). No necesitas cerrar sesión para verlo.',
  },
  {
    title: 'Si ya iniciaste sesión',
    body: 'Verás un aviso azul arriba: «Sesión iniciada». Puedes seguir navegando con normalidad. Usa el botón dorado «Perfil admin» o «Perfil padre» para volver a tu panel privado.',
  },
  {
    title: 'Botón «Sitio público» en el panel',
    body: 'Desde tu panel (menú izquierdo, abajo) abres el sitio público en la misma cuenta. Es útil para comprobar cómo se ve un aviso o un resultado publicado.',
    to: '/',
    label: 'Abrir sitio público',
  },
];

const ADMIN_STEPS: Step[] = [
  {
    title: 'Plantilla',
    body: 'Registra jugadores con foto, categoría, CURP y datos. Los padres vinculan a sus hijos con esa CURP.',
    to: '/dashboard/players',
    label: 'Ir a Plantilla',
  },
  {
    title: 'Partidos',
    body: 'Crea calendario: rival, fecha, sede, categoría. Los padres lo ven en la sección pública Partidos.',
    to: '/dashboard/matches',
    label: 'Ir a Partidos',
  },
  {
    title: 'Resultados',
    body: 'Registra el marcador y pulsa «Goles y tarjetas» para anotar goles, asistencias y tarjetas por jugador. Solo los resultados «Publicado» cuentan en las tablas del inicio público.',
    to: '/dashboard/results',
    label: 'Ir a Resultados',
  },
  {
    title: 'Avisos y galería',
    body: 'Publica comunicados (puedes marcar urgentes). Sube fotos de partidos o entrenamientos.',
    to: '/dashboard/notices',
    label: 'Ir a Avisos',
  },
  {
    title: 'Vínculos padres',
    body: 'Cuando un padre envía solicitud con la CURP del jugador, aprueba o rechaza aquí.',
    to: '/dashboard/link-requests',
    label: 'Ir a Vínculos',
  },
  {
    title: 'Usuarios y ajustes',
    body: 'Crea entrenadores/admins, desbloquea cuentas, cambia correos. En Ajustes defines temporada, color y correo de contacto del club (no es el correo de login).',
    to: '/dashboard/settings',
    label: 'Ir a Ajustes',
  },
];

const PARENT_STEPS: Step[] = [
  {
    title: 'Vincular a tu hijo',
    body: 'Necesitas la CURP de 18 caracteres que registró el club. Envías solicitud y un administrador la aprueba.',
    to: '/dashboard/mis-jugadores',
    label: 'Ir a Mis jugadores',
  },
  {
    title: 'Ver perfil del jugador',
    body: 'Desde Mis jugadores abres el perfil público: foto, credencial QR y datos. Es el mismo que ven otros en /jugadores.',
  },
  {
    title: 'Partidos y resultados',
    body: 'En el sitio público consulta calendario y marcadores. No hace falta entrar al panel solo para eso.',
    to: '/partidos',
    label: 'Ver partidos públicos',
  },
  {
    title: 'Avisos del club',
    body: 'Comunicados oficiales en Avisos. Activa notificaciones si el navegador te lo pide.',
    to: '/avisos',
    label: 'Ver avisos',
  },
  {
    title: 'Mi perfil',
    body: 'Cambia contraseña, foto y (opcional) verificación en dos pasos. El cambio de correo de login requiere confirmar el enlace al nuevo buzón.',
    to: '/dashboard/cuenta',
    label: 'Ir a Mi perfil',
  },
];

const COACH_STEPS: Step[] = [
  {
    title: 'Mismas herramientas que admin (sin usuarios)',
    body: 'Puedes gestionar plantilla, partidos, resultados, avisos y galería. No tienes acceso a Usuarios ni Ajustes del club.',
  },
  {
    title: 'Resultados con estadísticas',
    body: 'Tras cada partido, publica el resultado y registra goles/tarjetas para que las tablas del sitio se actualicen.',
    to: '/dashboard/results',
    label: 'Ir a Resultados',
  },
];

export function DashboardGuidePage() {
  const { user } = useAuth();
  const role = user?.role;
  const panelTitle = getPanelTitle(role);

  const showAdmin = role === 'admin';
  const showCoach = role === 'coach';
  const showParent = role === 'parent';

  return (
    <div className="flex flex-col gap-stack-lg max-w-3xl">
      <header>
        <h1 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-2">
          <MaterialIcon name="menu_book" className="text-primary" />
          Guía de uso
        </h1>
        <p className="text-on-surface-variant mt-2">
          Tutorial de <strong className="text-primary">{panelTitle}</strong> y del sitio público F.C. Barcelona Cupido.
        </p>
      </header>

      <GuideSection
        id="sitio-publico"
        icon="public"
        title="Sitio público (con o sin sesión)"
        intro="El sitio público y tu panel privado conviven: no tienes que cerrar sesión para ver la web del club."
        steps={PUBLIC_SITE_STEPS}
      />

      {showParent && (
        <GuideSection
          id="padres"
          icon="family_restroom"
          title="Perfil padre / tutor"
          intro="Pasos recomendados la primera vez que entras."
          steps={PARENT_STEPS}
        />
      )}

      {(showAdmin || showCoach) && (
        <GuideSection
          id="tecnico"
          icon={showAdmin ? 'admin_panel_settings' : 'sports'}
          title={showAdmin ? 'Perfil administrador' : 'Perfil entrenador'}
          intro={showAdmin ? 'Gestión completa del club.' : 'Gestión operativa del equipo.'}
          steps={showAdmin ? ADMIN_STEPS : COACH_STEPS}
        />
      )}

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-on-surface-variant">
        <p className="flex items-start gap-2">
          <MaterialIcon name="help" className="text-primary shrink-0" size={20} />
          <span>
            ¿Dudas técnicas? Usa{' '}
            <Link to="/soporte" className="text-primary hover:underline">
              Soporte
            </Link>{' '}
            o contacto en{' '}
            <Link to="/contacto" className="text-primary hover:underline">
              Contacto
            </Link>
            .
          </span>
        </p>
      </div>
    </div>
  );
}
