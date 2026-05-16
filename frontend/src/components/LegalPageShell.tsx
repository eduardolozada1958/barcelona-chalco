import { Link } from 'react-router-dom';

import { CLUB_DISPLAY_NAME } from '@/config/club';

type LegalPageShellProps = {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
};

/**
 * Contenedor para páginas legales/informativas del sitio público.
 */
export function LegalPageShell({ title, lastUpdated, children }: LegalPageShellProps) {
  const updated =
    lastUpdated ??
    new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <article className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-3xl mx-auto pb-stack-lg">
      <header className="mb-stack-md border-b border-outline-variant/30 pb-stack-sm">
        <h1 className="font-display-hero text-headline-lg text-primary">{title}</h1>
        <p className="text-sm text-on-surface-variant mt-2">
          {CLUB_DISPLAY_NAME} · Última actualización: {updated}
        </p>
        <p className="text-xs text-on-surface-variant/80 mt-3 leading-relaxed">
          Este texto es informativo para padres, jugadores y visitantes del sitio. No sustituye asesoría
          legal profesional.
        </p>
      </header>
      <div className="space-y-5 text-on-surface-variant font-body-md text-body-md leading-relaxed [&_h2]:text-on-surface [&_h2]:font-headline-lg-mobile [&_h2]:text-headline-lg-mobile [&_h2]:mt-6 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
      <footer className="mt-stack-lg pt-stack-md border-t border-outline-variant/20 flex flex-wrap gap-4 text-sm">
        <Link to="/" className="text-primary hover:underline">
          Inicio
        </Link>
        <Link to="/contacto" className="text-primary hover:underline">
          Contacto
        </Link>
        <Link to="/privacidad" className="text-primary hover:underline">
          Privacidad
        </Link>
        <Link to="/terminos" className="text-primary hover:underline">
          Términos
        </Link>
        <Link to="/cookies" className="text-primary hover:underline">
          Cookies
        </Link>
      </footer>
    </article>
  );
}
