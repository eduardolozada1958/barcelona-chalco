import { useEffect } from 'react';

import {
  organizationJsonLd,
  resolveSeo,
  SITE_LANG,
  SITE_LOCALE,
  SITE_NAME,
  type SeoMeta,
  webSiteJsonLd,
} from '@/config/seo';

function upsertMeta(
  key: string,
  content: string,
  attr: 'name' | 'property' = 'name',
): void {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id: string, data: object): void {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

type PageSeoProps = SeoMeta & {
  /** JSON-LD extra (p. ej. Person, SportsEvent). */
  jsonLd?: object | object[];
  /** Inyectar datos de organización + sitio (solo inicio). */
  includeSiteJsonLd?: boolean;
};

/**
 * Actualiza title, meta description, Open Graph, Twitter y canonical por ruta.
 */
export function PageSeo({
  title,
  description,
  path,
  image,
  type,
  noindex,
  keywords,
  jsonLd,
  includeSiteJsonLd = false,
}: PageSeoProps) {
  const seo = resolveSeo({ title, description, path, image, type, noindex, keywords });

  useEffect(() => {
    document.title = seo.title;
    document.documentElement.lang = SITE_LANG;

    upsertMeta('description', seo.description);
    upsertMeta('keywords', seo.keywords);
    upsertMeta('robots', seo.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    upsertMeta('author', SITE_NAME);
    upsertMeta('geo.region', 'MX-MEX');
    upsertMeta('geo.placename', 'Chalco, Estado de México');

    upsertLink('canonical', seo.canonical);

    upsertMeta('og:locale', SITE_LOCALE, 'property');
    upsertMeta('og:site_name', SITE_NAME, 'property');
    upsertMeta('og:type', seo.type, 'property');
    upsertMeta('og:title', seo.title, 'property');
    upsertMeta('og:description', seo.description, 'property');
    upsertMeta('og:url', seo.canonical, 'property');
    upsertMeta('og:image', seo.image, 'property');
    upsertMeta('og:image:alt', SITE_NAME, 'property');

    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', seo.title);
    upsertMeta('twitter:description', seo.description);
    upsertMeta('twitter:image', seo.image);

    if (includeSiteJsonLd) {
      upsertJsonLd('seo-org', organizationJsonLd());
      upsertJsonLd('seo-website', webSiteJsonLd());
    }

    if (jsonLd) {
      const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      blocks.forEach((block, i) => upsertJsonLd(`seo-page-${i}`, block));
    } else {
      document.querySelectorAll('script[id^="seo-page-"]').forEach((n) => n.remove());
    }
  }, [
    seo.title,
    seo.description,
    seo.keywords,
    seo.canonical,
    seo.image,
    seo.type,
    seo.noindex,
    jsonLd,
    includeSiteJsonLd,
  ]);

  return null;
}
