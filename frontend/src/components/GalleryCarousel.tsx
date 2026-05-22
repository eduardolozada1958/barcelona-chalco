import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { MaterialIcon } from '@/components/MaterialIcon';

export type GalleryCarouselSlide = {
  id: string;
  imageUrl: string | null;
  title?: string;
  caption?: string;
  dateLabel?: string;
  href?: string;
  mediaType?: 'image' | 'video';
};

type GalleryCarouselProps = {
  slides: GalleryCarouselSlide[];
  /** Segundos entre cambios automáticos; 0 = desactivado. */
  autoplaySec?: number;
  className?: string;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return reduced;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

export function GalleryCarousel({
  slides,
  autoplaySec = 6,
  className = '',
}: GalleryCarouselProps) {
  const [[index, direction], setIndex] = useState([0, 0]);
  const reducedMotion = usePrefersReducedMotion();

  const count = slides.length;
  const current = count > 0 ? slides[index] : null;

  const paginate = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setIndex(([i]) => {
        const next = (i + delta + count) % count;
        return [next, delta];
      });
    },
    [count],
  );

  const goTo = useCallback(
    (i: number) => {
      if (i === index || count < 2) return;
      setIndex([i, i > index ? 1 : -1]);
    },
    [index, count],
  );

  useEffect(() => {
    if (!autoplaySec || count < 2 || reducedMotion) return;
    const id = window.setInterval(() => paginate(1), autoplaySec * 1000);
    return () => window.clearInterval(id);
  }, [autoplaySec, count, paginate, reducedMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (count < 2) return;
      if (e.key === 'ArrowLeft') paginate(-1);
      if (e.key === 'ArrowRight') paginate(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, paginate]);

  if (count === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container/30 py-20 ${className}`}
      >
        <MaterialIcon name="photo_library" className="text-on-surface-variant mb-3" size={48} />
        <p className="text-on-surface-variant text-sm">Sin imágenes</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-outline-variant/20 shadow-xl bg-surface-container-low ${className}`}
    >
      <div className="relative aspect-[16/10] max-h-[min(70vh,560px)] w-full bg-black/80">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current!.id}
            custom={direction}
            variants={reducedMotion ? undefined : slideVariants}
            initial={reducedMotion ? false : 'enter'}
            animate="center"
            exit={reducedMotion ? undefined : 'exit'}
            transition={{ type: 'tween', duration: reducedMotion ? 0 : 0.35, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {current!.mediaType === 'video' && current!.imageUrl ? (
              <video
                src={current!.imageUrl}
                controls
                className="max-h-full max-w-full w-full h-full object-contain"
              />
            ) : current!.imageUrl ? (
              <img
                src={current!.imageUrl}
                alt={current!.title || 'Imagen de galería'}
                className="max-h-full max-w-full w-full h-full object-contain"
                draggable={false}
              />
            ) : (
              <MaterialIcon name="image" className="text-on-surface-variant" size={64} />
            )}
          </motion.div>
        </AnimatePresence>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => paginate(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white hover:bg-primary hover:text-on-primary border border-white/10 touch-manipulation transition-colors"
              aria-label="Anterior"
            >
              <MaterialIcon name="chevron_left" size={28} />
            </button>
            <button
              type="button"
              onClick={() => paginate(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white hover:bg-primary hover:text-on-primary border border-white/10 touch-manipulation transition-colors"
              aria-label="Siguiente"
            >
              <MaterialIcon name="chevron_right" size={28} />
            </button>
            <span className="absolute top-3 left-3 z-10 rounded-full bg-black/55 px-3 py-1 text-[11px] font-label-caps text-white border border-white/10">
              {index + 1} / {count}
            </span>
          </>
        ) : null}
      </div>

      {(current!.title || current!.caption || current!.dateLabel || current!.href) ? (
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-surface-container-low border-t border-outline-variant/20">
          {current!.dateLabel ? (
            <p className="font-label-caps text-[10px] text-primary tracking-widest mb-1">{current!.dateLabel}</p>
          ) : null}
          {current!.title ? (
            <h2 className="font-headline-lg text-lg sm:text-xl text-on-surface">{current!.title}</h2>
          ) : null}
          {current!.caption ? (
            <p className="mt-2 text-sm text-on-surface-variant line-clamp-3">{current!.caption}</p>
          ) : null}
          {current!.href ? (
            <Link
              to={current!.href}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-caps text-[11px] hover:shadow-gold-glow transition-shadow"
            >
              Ver álbum completo
              <MaterialIcon name="arrow_forward" size={16} />
            </Link>
          ) : null}
        </div>
      ) : null}

      {count > 1 ? (
        <div className="px-3 sm:px-4 py-3 bg-surface-container border-t border-outline-variant/15">
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir a imagen ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                className={`snap-start shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all touch-manipulation ${
                  i === index
                    ? 'border-primary ring-2 ring-primary/30 opacity-100 scale-105'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt="" className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <span className="w-full h-full flex items-center justify-center bg-surface-container-high">
                    <MaterialIcon name="image" size={20} className="text-on-surface-variant" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
