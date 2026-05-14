import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import clsx from 'clsx';

import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcon } from '@/components/MaterialIcon';

/* ─── Navigation Links ─── */
const publicLinks = [
  { to: '/',            label: 'Inicio',      end: true },
  { to: '/jugadores',   label: 'Jugadores' },
  { to: '/partidos',    label: 'Partidos' },
  { to: '/resultados',  label: 'Resultados' },
  { to: '/avisos',      label: 'Avisos' },
  { to: '/galeria',     label: 'Galería' },
  { to: '/inscripcion', label: 'Inscripción' },
];

const footerLinks = [
  { href: '#', label: 'Política de Privacidad' },
  { href: '#', label: 'Términos de Servicio' },
  { href: '#', label: 'Política de Cookies' },
  { href: '#', label: 'Soporte' },
];

/* ─── Layout ─── */
export function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background font-body-md">
      {/* ═══════════════════ TopNavBar ═══════════════════ */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 bg-surface/80 backdrop-blur-md bg-surface-container-lowest/40 border-b border-outline-variant/20 shadow-md">
        {/* Logo */}
        <NavLink
          to="/"
          className="flex items-center gap-3 shrink-0"
        >
          <img src="/images/logo.png" alt="F.C. Barcelona Cupido" className="h-12 w-12 object-contain drop-shadow-lg" />
          <span className="font-display-hero text-headline-lg-mobile text-primary tracking-tighter hidden sm:inline">F.C. BARCELONA CUPIDO</span>
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
            <NavLink
              to="/dashboard"
              className="bg-primary-container text-on-primary-container px-6 py-2 rounded-full font-label-caps text-label-caps hover:shadow-gold-glow transition-all"
            >
              Dashboard
            </NavLink>
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
          className="md:hidden p-2"
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

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 pt-20 bg-background/95 backdrop-blur-lg md:hidden flex flex-col">
          <div className="flex flex-col gap-2 px-margin-mobile py-stack-md">
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
                <NavLink
                  to="/dashboard"
                  className="block w-full py-3 bg-primary-container text-on-primary-container font-label-caps text-label-caps rounded-lg text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </NavLink>
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
      )}

      {/* ═══════════════════ Main Content ═══════════════════ */}
      <main className="flex-grow pt-20">
        <Outlet />
      </main>

      {/* ═══════════════════ Footer ═══════════════════ */}
      <footer className="w-full py-stack-lg px-margin-mobile md:px-margin-desktop flex flex-col items-center gap-stack-md bg-surface-container-lowest border-t border-outline-variant/20 mt-auto">
        <div className="flex items-center gap-4 justify-center">
          <img src="/images/logo.png" alt="F.C. Barcelona Cupido" className="h-14 w-14 object-contain drop-shadow-lg" />
          <span className="font-display-hero text-primary text-2xl">F.C. BARCELONA CUPIDO</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {footerLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="font-body-md text-body-md text-on-surface-variant text-center text-sm opacity-60">
          © {new Date().getFullYear()} F.C. BARCELONA CUPIDO. Rendimiento Élite & Identidad Digital.
        </div>
      </footer>
    </div>
  );
}
