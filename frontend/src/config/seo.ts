import { CLUB_DISPLAY_NAME, CLUB_LOGO_URL } from '@/config/club';

/** URL canónica del sitio (sin barra final). */
export const SITE_URL = (
  import.meta.env.VITE_PUBLIC_APP_URL || 'https://barcelona-chalco.pages.dev'
).replace(/\/$/, '');

export const SITE_NAME = CLUB_DISPLAY_NAME;
export const SITE_LOCALE = 'es_MX';
export const SITE_LANG = 'es';

const DEFAULT_OG_IMAGE = `${SITE_URL}${CLUB_LOGO_URL}`;

export const SEO_DEFAULTS = {
  title: `${SITE_NAME} | Academia de Fútbol en Chalco, Edomex`,
  description:
    'F.C. Barcelona Cupido: plantilla, resultados, partidos, goleo, avisos y credencial digital QR. Academia de fútbol formativo en Chalco y Valle de Chalco, Estado de México.',
  keywords:
    'Barcelona Cupido, academia fútbol Chalco, escuela de fútbol Chalco, club infantil Edomex, plantilla jugadores, resultados partidos, credencial digital futbol, Valle de Chalco fútbol, formación futbolística México',
  image: DEFAULT_OG_IMAGE,
  twitterCard: 'summary_large_image' as const,
};

export type SeoMeta = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  keywords?: string;
};

export function absoluteUrl(path = ''): string {
  if (!path || path === '/') return SITE_URL;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

export function buildTitle(pageTitle?: string): string {
  if (!pageTitle) return SEO_DEFAULTS.title;
  return `${pageTitle} | ${SITE_NAME}`;
}

export function resolveSeo(meta: SeoMeta = {}) {
  const path = meta.path ?? '/';
  return {
    title: buildTitle(meta.title),
    description: meta.description ?? SEO_DEFAULTS.description,
    keywords: meta.keywords ?? SEO_DEFAULTS.keywords,
    canonical: absoluteUrl(path),
    image: meta.image || SEO_DEFAULTS.image,
    type: meta.type ?? 'website',
    noindex: Boolean(meta.noindex),
    path,
  };
}

/** SEO estático por ruta pública (sin datos dinámicos). */
export function getStaticRouteSeo(pathname: string): SeoMeta {
  const base = pathname.split('?')[0].replace(/\/$/, '') || '/';

  const routes: Record<string, SeoMeta> = {
    '/': {
      title: 'Inicio',
      description:
        'Sitio oficial de F.C. Barcelona Cupido: consulta jugadores, próximos partidos, resultados, tabla de goleo, avisos del club y validación de credencial digital en Chalco.',
      path: '/',
    },
    '/jugadores': {
      title: 'Plantilla de jugadores',
      description:
        'Conoce la plantilla de F.C. Barcelona Cupido: perfiles, categorías, estadísticas y credencial digital de cada jugador verificado.',
      path: '/jugadores',
    },
    '/partidos': {
      title: 'Próximos partidos',
      description:
        'Calendario de partidos y entrenamientos de Barcelona Cupido: fechas, rivales, sedes y convocatorias.',
      path: '/partidos',
    },
    '/resultados': {
      title: 'Resultados y goleo',
      description:
        'Resultados publicados, marcadores y tabla de goleo y tarjetas de F.C. Barcelona Cupido.',
      path: '/resultados',
    },
    '/avisos': {
      title: 'Avisos del club',
      description:
        'Comunicados oficiales, avisos urgentes y noticias para padres y jugadores de Barcelona Cupido.',
      path: '/avisos',
    },
    '/galeria': {
      title: 'Galería',
      description:
        'Fotos de partidos, entrenamientos y momentos destacados de F.C. Barcelona Cupido.',
      path: '/galeria',
    },
    '/contacto': {
      title: 'Contacto e inscripción',
      description:
        'Contacta a la academia Barcelona Cupido en Chalco: inscripciones, información y WhatsApp del cuerpo técnico.',
      path: '/contacto',
    },
    '/credencial': {
      title: 'Validar credencial QR',
      description:
        'Escanea o valida la credencial digital QR de un jugador de F.C. Barcelona Cupido.',
      path: '/credencial',
    },
    '/privacidad': { title: 'Política de privacidad', path: '/privacidad', noindex: true },
    '/terminos': { title: 'Términos de servicio', path: '/terminos', noindex: true },
    '/cookies': { title: 'Política de cookies', path: '/cookies', noindex: true },
    '/soporte': { title: 'Soporte', path: '/soporte', noindex: true },
    '/login': { title: 'Acceso', path: '/login', noindex: true },
    '/register': { title: 'Registro de padres', path: '/register', noindex: true },
  };

  if (routes[base]) return routes[base];

  if (base.startsWith('/jugadores/')) {
    return { path: base, noindex: false };
  }
  if (base.startsWith('/partidos/')) return { path: base };
  if (base.startsWith('/avisos/')) return { path: base, type: 'article' };
  if (base.startsWith('/galeria/')) return { path: base };

  return { path: base, noindex: base.startsWith('/dashboard') };
}

/** Rutas públicas para sitemap.xml */
export const SITEMAP_PATHS: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/jugadores', changefreq: 'daily', priority: '0.9' },
  { path: '/partidos', changefreq: 'daily', priority: '0.9' },
  { path: '/resultados', changefreq: 'daily', priority: '0.85' },
  { path: '/avisos', changefreq: 'daily', priority: '0.85' },
  { path: '/galeria', changefreq: 'weekly', priority: '0.8' },
  { path: '/contacto', changefreq: 'monthly', priority: '0.75' },
  { path: '/credencial', changefreq: 'monthly', priority: '0.7' },
];

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: SITE_NAME,
    url: SITE_URL,
    logo: SEO_DEFAULTS.image,
    sport: 'Soccer',
    description: SEO_DEFAULTS.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Chalco',
      addressRegion: 'Estado de México',
      addressCountry: 'MX',
    },
  };
}

export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'es-MX',
    description: SEO_DEFAULTS.description,
    publisher: { '@type': 'SportsTeam', name: SITE_NAME },
  };
}
