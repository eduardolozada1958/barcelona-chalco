import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';

import { optimizeSupabaseImage, type OptimizeImageOptions } from '@/utils/media-url';

interface LazyMediaImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  /** Si true, carga de inmediato (primeras tarjetas visibles). */
  priority?: boolean;
  /** Optimización Supabase; si se omite, usa `src` tal cual. */
  optimize?: OptimizeImageOptions;
}

/**
 * Imagen con lazy load (nativo + Intersection Observer) y miniatura Supabase opcional.
 */
export function LazyMediaImage({
  src,
  priority = false,
  optimize,
  alt = '',
  className = '',
  onLoad,
  onError,
  ...rest
}: LazyMediaImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const [loaded, setLoaded] = useState(false);

  const displaySrc = optimize ? optimizeSupabaseImage(src, optimize) : (src?.trim() || null);

  useEffect(() => {
    if (priority || shouldLoad || !displaySrc) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '280px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, shouldLoad, displaySrc]);

  if (!displaySrc) return null;

  return (
    <img
      ref={ref}
      src={shouldLoad ? displaySrc : undefined}
      alt={alt}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={`${className}${loaded ? '' : ' opacity-0'} transition-opacity duration-300`}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={onError}
      {...rest}
    />
  );
}
