import { useLocation } from 'react-router-dom';

import { getStaticRouteSeo } from '@/config/seo';
import { PageSeo } from '@/components/PageSeo';

/** SEO por ruta en el sitio público (las páginas dinámicas pueden sobrescribir con su propio PageSeo). */
export function PublicRouteSeo() {
  const { pathname } = useLocation();
  const meta = getStaticRouteSeo(pathname);
  const isHome = pathname === '/' || pathname === '';

  return (
    <PageSeo
      title={meta.title}
      description={meta.description}
      path={meta.path ?? pathname}
      image={meta.image}
      type={meta.type}
      noindex={meta.noindex}
      keywords={meta.keywords}
      includeSiteJsonLd={isHome}
    />
  );
}
