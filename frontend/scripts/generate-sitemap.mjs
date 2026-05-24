/**
 * Genera public/sitemap.xml antes del build (URL canónica + rutas públicas).
 * Uso: node scripts/generate-sitemap.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const siteUrl = (process.env.VITE_PUBLIC_APP_URL || 'https://barcelona-chalco.pages.dev').replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);

const paths = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/jugadores', changefreq: 'daily', priority: '0.9' },
  { path: '/partidos', changefreq: 'daily', priority: '0.9' },
  { path: '/resultados', changefreq: 'daily', priority: '0.85' },
  { path: '/goleo', changefreq: 'daily', priority: '0.8' },
  { path: '/rendimiento', changefreq: 'weekly', priority: '0.8' },
  { path: '/avisos', changefreq: 'daily', priority: '0.85' },
  { path: '/galeria', changefreq: 'weekly', priority: '0.8' },
  { path: '/contacto', changefreq: 'monthly', priority: '0.75' },
  { path: '/credencial', changefreq: 'monthly', priority: '0.7' },
];

const urls = paths
  .map(
    ({ path, changefreq, priority }) => `  <url>
    <loc>${siteUrl}${path === '/' ? '/' : path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const out = join(root, 'public', 'sitemap.xml');
writeFileSync(out, xml, 'utf8');
console.log(`sitemap.xml → ${out} (${paths.length} URLs, ${siteUrl})`);
