import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcon } from '@/components/MaterialIcon';
import { PushNotificationsPrompt } from '@/components/PushNotificationsPrompt';
import { CLUB_LOGO_URL } from '@/config/club';
import { useClubSettings } from '@/hooks/useClubSettings';
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
  { to: '/avisos',      label: 'Avisos' },
  { to: '/galeria',     label: 'Galería' },
  { to: '/contacto', label: 'Contacto' },
];

const footerLinks = [
  { to: '/privacidad', label: 'Política de Privacidad' },
  { to: '/terminos', label: 'Términos de Servicio' },
  { to: '/cookies', label: 'Política de Cookies' },
  { to: '/soporte', label: 'Soporte' },
];

/* ─── Layout ─── */
export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const clubSettings = useClubSettings();
  const season = clubSettings.data?.season?.trim();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', mobileOpen);
    return () => document.body.classList.remove('mobile-menu-open');
  }, [mobileOpen]);

  return (
    <MobileMenuProvider open={mobileOpen}>
    <div className="min-h-screen flex flex-col bg-background text-on-background font-body-md min-w-0 overflow-x-hidden">
      <ScrollToTop />
      <PublicRouteSeo />
      <UrgentNoticePopup />
      {/* ═══════════════════ TopNavBar ═══════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-[90] flex justify-between items-end gap-2 px-3 sm:px-margin-mobile md:px-margin-desktop pb-2 sm:pb-3 min-h-[var(--public-header-h)] pt-[env(safe-area-inset-top,0px)] bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 shadow-md min-w-0">
        {/* Logo */}
        <NavLink
          to="/"
          className="flex items-center gap-3 shrink-0"
        >
          <img src={CLUB_LOGO_URL} alt="F.C. Barcelona Cupido" className="h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-lg shrink-0" />
          <span className="font-display-hero text-sm sm:text-headline-lg-mobile text-primary tracking-tighter truncate max-w-[42vw] sm:max-w-none hidden min-[400px]:inline">F.C. BARCELONA CUPIDO</span>
        </NavLink>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-gutter h-full">
          {publicLinks.map((l) => {
            const active = l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to);
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={'end' in l ? l.end : undefined}
                className={clsx(
                  'font-label-caps text-label-caps h-full flex items-center transition-all duration-300 hover:text-primary',
                  active
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-on-surface-variant scale-95 active:scale-90'
                )}
              >
                {l.label}
              </NavLink>
            );
          })}
        </div>

        {/* Auth button (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <NavLink
                to="/dashboard/guia"
                className="hidden lg:inline-flex items-center gap-1 text-primary/90 font-label-caps text-[10px] hover:underline"
              >
                <MaterialIcon name="menu_book" size={16} />
                Guía
              </NavLink>
              <NavLink
                to="/dashboard"
                className="inline-flex items-center gap-1.5 bg-primary-container text-on-primary-container px-5 py-2 rounded-full font-label-caps text-label-caps hover:shadow-gold-glow transition-all"
              >
                <MaterialIcon name={getPanelNavIcon(user.role)} size={18} />
                {getPanelShortLabel(user.role)}
              </NavLink>
            </>
          ) : (
            <NavLink
              to="/login"
              className="bg-surface-container-lowest text-primary border-2 border-primary px-6 py-2 rounded-full font-label-caps text-label-caps hover:bg-primary hover:text-on-primary transition-colors duration-300"
            >
              Acceder
            </NavLink>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 shrink-0 touch-manipulation"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <MaterialIcon
            name={mobileOpen ? 'close' : 'menu'}
            className="text-primary"
            size={28}
          />
        </button>
      </nav>

      {/* Menú móvil por encima de MVP / fuegos */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex flex-col bg-background">
          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-outline-variant/20 bg-background">
              <span className="font-label-caps text-label-caps text-primary">Menú</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/30 text-primary hover:bg-primary/10 touch-manipulation"
                aria-label="Cerrar menú"
              >
                <MaterialIcon name="close" size={28} />
              </button>
            </div>
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-margin-mobile py-stack-md pb-[max(1rem,env(safe-area-inset-bottom))]">
            {publicLinks.map((l) => {
              const active = l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to);
              return (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={'end' in l ? l.end : undefined}
                  className={clsx(
                    'font-label-caps text-label-caps py-3 border-b border-outline-variant/20 transition-colors',
                    active ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </NavLink>
              );
            })}
            <div className="mt-stack-md">
              {user ? (
                <>
                  <NavLink
                    to="/dashboard"
                    className="block w-full py-3 bg-primary-container text-on-primary-container font-label-caps text-label-caps rounded-lg text-center flex items-center justify-center gap-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    <MaterialIcon name={getPanelNavIcon(user.role)} size={18} />
                    {getPanelShortLabel(user.role)}
                  </NavLink>
                  <NavLink
                    to="/dashboard/guia"
                    className="block w-full py-2 mt-2 border border-primary/40 text-primary font-label-caps text-label-caps rounded-lg text-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    Guía de uso
                  </NavLink>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="block w-full py-3 bg-primary text-on-primary font-label-caps text-label-caps rounded-lg text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Acceder
                </NavLink>
              )}
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
        <div className="flex flex-wrap justify-center gap-6">
          <a
            href="/sitemap.xml"
            className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100"
          >
            Mapa del sitio
          </a>
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
          {season ? ` · Temporada ${season}` : ''}. Rendimiento Élite & Identidad Digital.
        </div>
      </footer>
    </div>
    </MobileMenuProvider>
  );
}
