/** Supabase Storage: object/public → render/image/public con resize en CDN. */
const SUPABASE_OBJECT_PUBLIC =
  /^https:\/\/([^/]+)\/storage\/v1\/object\/public\/(.+)$/i;

export type ImageResize = 'cover' | 'contain' | 'fill';

export interface OptimizeImageOptions {
  width: number;
  height?: number;
  quality?: number;
  resize?: ImageResize;
}

/**
 * Devuelve URL optimizada para avatares/fotos en Supabase.
 * Si no es Supabase, devuelve la URL original.
 */
export function optimizeSupabaseImage(
  url: string | null | undefined,
  opts: OptimizeImageOptions,
): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  const match = SUPABASE_OBJECT_PUBLIC.exec(trimmed);
  if (!match) return trimmed;

  const [, host, objectPath] = match;
  const params = new URLSearchParams();
  params.set('width', String(opts.width));
  if (opts.height) params.set('height', String(opts.height));
  params.set('quality', String(opts.quality ?? 78));
  params.set('resize', opts.resize ?? 'cover');

  return `https://${host}/storage/v1/render/image/public/${objectPath}?${params.toString()}`;
}

/** Tarjeta jugadores (grilla): ~256px alto × 2 retina. */
export function playerCardAvatarUrl(url: string | null | undefined): string | null {
  return optimizeSupabaseImage(url, { width: 520, height: 640, quality: 75, resize: 'cover' });
}

/** Credencial / miniatura. */
export function playerThumbAvatarUrl(url: string | null | undefined): string | null {
  return optimizeSupabaseImage(url, { width: 200, height: 240, quality: 75, resize: 'cover' });
}

/** Perfil público (foto grande). */
export function playerProfileAvatarUrl(url: string | null | undefined): string | null {
  return optimizeSupabaseImage(url, { width: 560, height: 747, quality: 80, resize: 'cover' });
}

/** Avatar circular en tablas. */
export function playerAvatarIconUrl(url: string | null | undefined, size: 'sm' | 'md'): string | null {
  const px = size === 'sm' ? 64 : 80;
  return optimizeSupabaseImage(url, { width: px, height: px, quality: 75, resize: 'cover' });
}

/** Precarga en segundo plano (hover / prefetch). */
export function prefetchImageUrl(url: string | null | undefined): void {
  if (!url) return;
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}
