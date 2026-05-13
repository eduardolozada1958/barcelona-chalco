import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import clsx from 'clsx';
import { useAuth, type SessionRole } from '@/contexts/AuthContext';
import { MaterialIcon } from '@/components/MaterialIcon';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles: SessionRole[];
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/dashboard',               label: 'Inicio',        icon: 'dashboard',       roles: ['admin','coach','parent'], end: true },
  { to: '/dashboard/mis-jugadores', label: 'Mis Jugadores', icon: 'family_restroom', roles: ['parent'] },
  { to: '/dashboard/players',       label: 'Plantilla',     icon: 'groups',          roles: ['admin','coach'] },
  { to: '/dashboard/matches',       label: 'Partidos',      icon: 'calendar_today',  roles: ['admin','coach'] },
  { to: '/dashboard/results',       label: 'Resultados',    icon: 'sports_score',    roles: ['admin','coach'] },
  { to: '/dashboard/notices',       label: 'Avisos',        icon: 'campaign',        roles: ['admin','coach'] },
  { to: '/dashboard/gallery',       label: 'Galería',       icon: 'photo_library',   roles: ['admin','coach'] },
  { to: '/dashboard/inscriptions',  label: 'Inscripciones', icon: 'assignment',      roles: ['admin','coach'] },
  { to: '/dashboard/users',         label: 'Usuarios',      icon: 'manage_accounts', roles: ['admin'] },
  { to: '/dashboard/settings',      label: 'Ajustes',       icon: 'settings',        roles: ['admin'] },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visible = NAV.filter((i) => user && i.roles.includes(user.role));

  const handleLogout = async () => { await logout(); navigate('/'); };

  const sidebar = (
    <>
      <div className="px-gutter mb-stack-lg mt-stack-md flex items-center gap-stack-sm">
        <img src="/images/logo.png" alt="F.C. Barcelona Cupido" className="w-12 h-12 object-contain shrink-0 drop-shadow-lg" />
        <div className="min-w-0">
          <h1 className="font-display-hero text-body-lg text-primary tracking-tight truncate">Barcelona Chalco</h1>
          <p className="font-label-caps text-label-caps text-on-surface-variant opacity-80">Gestión Élite</p>
        </div>
      </div>
      <ul className="flex-1 space-y-1 px-2 overflow-y-auto">
        {visible.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-stack-sm px-4 py-3 rounded-lg mx-1 transition-all duration-200 font-label-caps text-label-caps',
                isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-variant/50'
              )}
            >
              {({ isActive }) => (<><MaterialIcon name={item.icon} filled={isActive} /><span>{item.label}</span></>)}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="px-4 mt-auto space-y-3 pb-stack-sm border-t border-outline-variant/10 pt-4">
        <NavLink to="/" className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-3 rounded hover:shadow-gold-glow transition-all flex items-center justify-center gap-2">
          <MaterialIcon name="public" size={18} /> Sitio Público
        </NavLink>
        <button type="button" onClick={() => void handleLogout()} className="w-full flex items-center gap-stack-sm px-4 py-2 text-on-surface-variant hover:text-error transition-colors rounded-lg font-label-caps text-label-caps">
          <MaterialIcon name="logout" size={20} /> Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex">
      <nav className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/10 shadow-lg py-base z-40">
        {sidebar}
      </nav>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <nav className="relative w-72 h-screen bg-surface-container-low border-r border-outline-variant/10 shadow-xl flex flex-col py-base">
            <button type="button" className="absolute top-4 right-4 p-1" onClick={() => setMobileOpen(false)}>
              <MaterialIcon name="close" className="text-on-surface-variant" />
            </button>
            {sidebar}
          </nav>
        </div>
      )}
      <main className="w-full md:ml-64 flex-1 p-margin-mobile md:p-margin-desktop bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface-container/40 via-background to-background min-h-screen">
        <div className="md:hidden flex items-center justify-between mb-stack-md pb-stack-sm border-b border-outline-variant/20">
          <button type="button" onClick={() => setMobileOpen(true)} className="p-2"><MaterialIcon name="menu" className="text-primary" size={28} /></button>
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            <span className="font-display-hero text-body-lg text-primary">Barcelona Chalco</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center border border-outline-variant/30">
            <MaterialIcon name="person" className="text-on-surface-variant" size={18} />
          </div>
        </div>
        <div className="max-w-container-max mx-auto"><Outlet /></div>
      </main>
    </div>
  );
}
