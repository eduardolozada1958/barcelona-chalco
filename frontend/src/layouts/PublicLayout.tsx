import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcon } from '@/components/MaterialIcon';
import { PushNotificationsPrompt } from '@/components/PushNotificationsPrompt';
import { CLUB_LOGO_URL } from '@/config/club';
import { useDisplaySeason } from '@/hooks/useClubSettings';
import { getPanelNavIcon, getPanelShortLabel } from '@/config/panel-labels';
import { LoggedInPublicBanner } from '@/components/LoggedInPublicBanner';
import { ScrollToTop } from '@/components/ScrollToTop';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';
import { UrgentNoticePopup } from '@/components/UrgentNoticePopup';
import { PublicRouteSeo } from '@/components/PublicRouteSeo';

/* ─── Navigation Links ─── */
const publicLinks = [
  { to: '/',            label: 'Inicio',      end: true },
  { to: '/jugadores',   label: 'Jugadores' },
  { to: '/partidos',    label: 'Partidos' },
  { to: '/resultados',  label: 'Resultados' },
  { to: '/goleo',       label: 'Goleo' },
  { to: '/rendimiento', label: 'Rendimiento' },
  { to: '/avisos',      label: 'Avisos' },
  { to: '/galeria',     label: 'Galería' },
  { to: '/contacto',    label: 'Contacto' },
];

const footerLinks = [
  { to: '/privacidad', label: 'Política de Privacidad' },
  { to: '/terminos', label: 'Términos de Servicio' },
  { to: '/cookies', label: 'Política de Cookies' },
  { to: '/soporte', label: 'Soporte' },
];

type PublicLink = (typeof publicLinks)[number];

function useLinkActive(link: PublicLink) {
  const location = useLocation();
  return link.to === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(link.to);
}

function PublicNavItem({
  link,
  onNavigate,
  compact,
}: {
  link: PublicLink;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const active = useLinkActive(link);

  return (
    <NavLink
      to={link.to}
      end={'end' in link ? link.end : undefined}
      onClick={onNavigate}
      className={clsx(
        'inline-flex items-center justify-center font-label-caps tracking-[0.08em] whitespace-nowrap transition-all duration-200',
        compact
          ? 'text-[11px] px-2.5 py-1 rounded-full'
          : 'text-[11px] sm:text-xs px-3 py-1.5 rounded-full',
        active
          ? 'text-primary bg-primary/12 border border-primary/30 shadow-[0_0_14px_rgba(212,175,55,0.12)]'
          : 'text-on-surface-variant border border-transparent hover:text-primary hover:bg-surface-container-high hover:border-outline-variant/25',
      )}
    >
      {link.label}
    </NavLink>
  );
}

function MobileNavItem({ link, onNavigate }: { link: PublicLink; onNavigate: () => void }) {
  const active = useLinkActive(link);

  return (
    <NavLink
      to={link.to}
      end={'end' in link ? link.end : undefined}
      className={clsx(
        'font-label-caps text-[11px] tracking-wide px-3 py-3 rounded-xl border text-center transition-colors',
        active
          ? 'text-primary bg-primary/12 border-primary/30'
          : 'text-on-surface-variant border-outline-variant/20 hover:text-primary hover:border-primary/25',
      )}
      onClick={onNavigate}
    >
      {link.label}
    </NavLink>
  );
}

function PublicAuthActions({ className }: { className?: string }) {
  const { user } = useAuth();

  return (
    <div className={clsx('flex items-center gap-2 sm:gap-3 shrink-0', className)}>
      {user ? (
        <>
          <NavLink
            to="/dashboard/guia"
            className="hidden xl:inline-flex items-center gap-1 text-primary/90 font-label-caps text-[10px] hover:underline"
          >
            <MaterialIcon name="menu_book" size={16} />
            Guía
          </NavLink>
          <NavLink
            to="/dashboard"
            className="inline-flex items-center gap-1.5 bg-primary-container text-on-primary-container px-4 sm:px-5 py-2 rounded-full font-label-caps text-[10px] sm:text-label-caps hover:shadow-gold-glow transition-all"
          >
            <MaterialIcon name={getPanelNavIcon(user.role)} size={18} />
            <span className="hidden sm:inline">{getPanelShortLabel(user.role)}</span>
            <span className="sm:hidden">Panel</span>
          </NavLink>
        </>
      ) : (
        <NavLink
          to="/login"
          className="bg-surface-container-lowest text-primary border-2 border-primary px-5 sm:px-6 py-2 rounded-full font-label-caps text-[10px] sm:text-label-caps hover:bg-primary hover:text-on-primary transition-colors duration-300"
        >
          Acceder
        </NavLink>
      )}
    </div>
  );
}

function PublicBrand() {
  return (
    <NavLink
      to="/"
      className="flex items-center gap-2.5 shrink-0 min-w-0 group hover:opacity-90 transition-opacity"
    >
      <img
        src={CLUB_LOGO_URL}
        alt="F.C. Barcelona Cupido"
        className="h-9 w-9 sm:h-10 sm:w-10 object-contain drop-shadow-md shrink-0"
      />
      <span className="hidden min-[400px]:block font-label-caps text-[11px] lg:text-xs tracking-[0.1em] text-primary uppercase leading-tight whitespace-nowrap">
        F.C. Barcelona Cupido
      </span>
    </NavLink>
  );
}

/* ─── Layout ─── */
export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const season = useDisplaySeason();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', mobileOpen);
    return () => document.body.classList.remove('mobile-menu-open');
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <MobileMenuProvider open={mobileOpen}>
      <div className="min-h-screen flex flex-col bg-background text-on-background font-body-md min-w-0 overflow-x-hidden">
        <ScrollToTop />
        <PublicRouteSeo />
        <UrgentNoticePopup />

        {/* ═══════════════════ Header público ═══════════════════ */}
        <header className="fixed top-0 left-0 right-0 z-[90] bg-surface/95 backdrop-blur-md shadow-md min-w-0 pt-[env(safe-area-inset-top,0px)]">
          <div className="mx-auto w-full max-w-[1400px] min-w-0 px-3 sm:px-margin-mobile lg:px-8 xl:px-margin-desktop">

            {/* ── Móvil / tablet: topbar (marca + acceso + menú) ── */}
            <div className="flex lg:hidden items-center justify-between gap-2 min-h-[3.5rem] sm:min-h-[3.75rem] py-2">
              <PublicBrand />
              <div className="flex items-center gap-2 shrink-0">
                <PublicAuthActions />
                <button
                  type="button"
                  className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-outline-variant/30 text-primary hover:bg-primary/10 touch-manipulation"
                  aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                  onClick={() => setMobileOpen((v) => !v)}
                >
                  <MaterialIcon name={mobileOpen ? 'close' : 'menu'} size={24} />
                </button>
              </div>
            </div>

            {/* ── Desktop: topbar + separador + franja de navegación ── */}
            <div className="hidden lg:block">
              {/* Topbar: logo + nombre + Acceder en una fila */}
              <div
                className="flex items-center justify-between gap-6 min-h-[3.5rem] py-2"
                role="banner"
              >
                <PublicBrand />
                <PublicAuthActions />
              </div>

              {/* Separador visual entre topbar y menú */}
              <div
                className="relative h-px w-full"
                aria-hidden
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-px bg-outline-variant/25" />
              </div>

              {/* Franja de navegación (segunda fila) */}
              <nav
                aria-label="Navegación principal"
                className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 py-3.5 px-2 bg-surface-container-lowest/30"
              >
                {publicLinks.map((l) => (
                  <PublicNavItem key={l.to} link={l} compact />
                ))}
              </nav>
            </div>
          </div>

          {/* Borde inferior del header completo */}
          <div className="h-px w-full bg-outline-variant/20" aria-hidden />
        </header>

        {/* Menú móvil */}
        {mobileOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden flex flex-col bg-background">
            <button
              type="button"
              className="absolute inset-0 z-0 cursor-default"
              aria-label="Cerrar menú"
              onClick={closeMobile}
            />
            <div className="relative z-10 flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-outline-variant/20 bg-background">
                <PublicBrand />
                <button
                  type="button"
                  onClick={closeMobile}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/30 text-primary hover:bg-primary/10 touch-manipulation"
                  aria-label="Cerrar menú"
                >
                  <MaterialIcon name="close" size={26} />
                </button>
              </div>
              <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-margin-mobile py-stack-md pb-[max(1rem,env(safe-area-inset-bottom))]">
                <p className="font-label-caps text-[10px] text-on-surface-variant mb-3 tracking-widest">
                  Navegación
                </p>
                <nav aria-label="Navegación móvil" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {publicLinks.map((l) => (
                    <MobileNavItem key={l.to} link={l} onNavigate={closeMobile} />
                  ))}
                </nav>
                <div className="mt-stack-md pt-stack-md border-t border-outline-variant/20">
                  <PublicAuthActions className="flex-col sm:flex-row w-full [&>a]:w-full [&>a]:justify-center" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ Main Content ═══════════════════ */}
        <main className="flex-grow pt-[var(--public-header-h)] min-w-0 overflow-x-hidden">
          <div className="pt-4 px-3 sm:px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto w-full min-w-0">
            <PushNotificationsPrompt />
            <LoggedInPublicBanner />
          </div>
          <Outlet />
        </main>

        {/* ═══════════════════ Footer ═══════════════════ */}
        <footer className="w-full py-stack-lg px-margin-mobile md:px-margin-desktop flex flex-col items-center gap-stack-md bg-surface-container-lowest border-t border-outline-variant/20 mt-auto">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center text-center px-2">
            <img src={CLUB_LOGO_URL} alt="F.C. Barcelona Cupido" className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-lg shrink-0" />
            <span className="font-display-hero text-primary text-lg sm:text-2xl leading-tight">F.C. BARCELONA CUPIDO</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {footerLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100"
              >
                {l.label}
              </NavLink>
            ))}
          </div>
          <div className="font-body-md text-body-md text-on-surface-variant text-center text-sm opacity-60">
            © {new Date().getFullYear()} F.C. BARCELONA CUPIDO
            {` · Temporada ${season}`}. Rendimiento Élite & Identidad Digital.
          </div>
        </footer>
      </div>
    </MobileMenuProvider>
  );
}
