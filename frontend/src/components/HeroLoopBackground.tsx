import { useEffect, useRef, useState } from 'react';

import { getIntroVideoUrl } from '@/hooks/useMobileIntro';

const HERO_POSTER =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80&auto=format&fit=crop';

type Props = {
  /** Pausa mientras la intro móvil está encima (evita dos videos a la vez). */
  paused?: boolean;
};

/** Fondo del hero: video en loop silencioso (estilo BBVA), con imagen de respaldo. */
export function HeroLoopBackground({ paused = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionOk, setMotionOk] = useState(true);
  const [videoOk, setVideoOk] = useState(true);
  const src = getIntroVideoUrl();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setMotionOk(!reduced);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !motionOk || !videoOk) return;
    if (paused) {
      v.pause();
      return;
    }
    void v.play().catch(() => setVideoOk(false));
  }, [paused, motionOk, videoOk]);

  const showVideo = motionOk && videoOk && Boolean(src);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {showVideo ? (
        <video
          ref={videoRef}
          src={src!}
          poster={HERO_POSTER}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none w-full h-full object-cover scale-105 opacity-30 mix-blend-overlay"
          onError={() => setVideoOk(false)}
        />
      ) : (
        <img
          src={HERO_POSTER}
          alt=""
          aria-hidden
          className="w-full h-full object-cover opacity-30 mix-blend-overlay"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
    </div>
  );
}
