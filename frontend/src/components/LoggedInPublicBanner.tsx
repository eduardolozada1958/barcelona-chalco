import { Link } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { getPanelNavIcon, getPanelShortLabel, getPanelTitle } from '@/config/panel-labels';
import { MaterialIcon } from '@/components/MaterialIcon';

/**
 * Aviso en el sitio público cuando ya hay sesión: puedes navegar con normalidad
 * y volver al panel con un clic.
 */
export function LoggedInPublicBanner() {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  const panelLabel = getPanelShortLabel(user.role);
  const panelTitle = getPanelTitle(user.role);

  return (
    <div
      className="mb-4 rounded-xl border border-primary/35 bg-[#002366]/50 backdrop-blur-md px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      role="status"
    >
      <div className="flex items-start gap-3 min-w-0">
        <MaterialIcon name="info" className="text-primary shrink-0 mt-0.5" size={22} />
        <div className="min-w-0">
          <p className="font-label-caps text-label-caps text-primary text-xs tracking-wide">
            Sesión iniciada · {panelTitle}
          </p>
          <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
            Estás viendo el <strong className="text-on-surface">sitio público</strong>. No pasa nada: puedes
            explorar jugadores, resultados y avisos. Para gestionar el club o tus hijos, entra a tu panel privado.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-[10px] tracking-wide hover:shadow-[0_0_12px_rgba(212,175,55,0.35)] transition-all"
        >
          <MaterialIcon name={getPanelNavIcon(user.role)} size={16} />
          {panelLabel}
        </Link>
        <Link
          to="/dashboard/guia"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/40 text-primary font-label-caps text-[10px] tracking-wide hover:bg-primary/10 transition-colors"
        >
          <MaterialIcon name="menu_book" size={16} />
          Guía de uso
        </Link>
      </div>
    </div>
  );
}
