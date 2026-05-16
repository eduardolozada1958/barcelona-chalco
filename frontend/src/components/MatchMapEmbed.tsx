import { useEffect, useState } from 'react';

import { MaterialIcon } from '@/components/MaterialIcon';

/** Solo iframes https de dominios de mapas conocidos (evita XSS por URL arbitraria). */
export function isAllowedMapIframeSrc(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.replace(/^www\./, '');
    if (h === 'google.com' || h.endsWith('.google.com')) return true;
    if (h === 'maps.googleapis.com') return true;
    return false;
  } catch {
    return false;
  }
}

interface MatchMapEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

export function MatchMapEmbed({ url, title = 'Ubicación en mapa', className = '' }: MatchMapEmbedProps) {
  if (!url || !isAllowedMapIframeSrc(url)) return null;
  return (
    <div className={`rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container/40 ${className}`}>
      <p className="text-[11px] font-label-caps text-label-caps text-on-surface-variant px-3 py-2 border-b border-outline-variant/20">
        {title}
      </p>
      <iframe
        src={url}
        title={title}
        className="w-full h-[220px] sm:h-[300px] border-0 bg-black/20"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

type MapLinkButtonProps = {
  /** URL de embed (solo https://www.google.com/maps/embed?...). No abrir en nueva pestaña: la API de embed exige iframe. */
  url: string;
  className?: string;
};

/**
 * Abre el mapa en un modal con &lt;iframe&gt;, válido para URLs `maps/embed`.
 * Evita el error “The Google Maps Embed API must be used in an iframe”.
 */
export function MapLinkButton({ url, className = '' }: MapLinkButtonProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!url || !isAllowedMapIframeSrc(url)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`mt-2 inline-flex items-center gap-1 text-xs font-label-caps text-primary hover:underline ${className}`}
      >
        <MaterialIcon name="map" size={14} /> Ver mapa
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[280] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-dialog-title"
            className="w-full sm:max-w-lg bg-surface-container border border-outline-variant/30 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 shrink-0">
              <h2 id="map-dialog-title" className="text-sm font-label-caps text-on-surface">
                Ubicación en mapa
              </h2>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-surface-container-high text-on-surface"
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>
            <iframe
              src={url}
              title="Mapa del lugar"
              className="w-full min-h-[55vh] sm:min-h-[300px] flex-1 border-0 bg-black/20"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
