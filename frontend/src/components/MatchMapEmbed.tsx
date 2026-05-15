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
