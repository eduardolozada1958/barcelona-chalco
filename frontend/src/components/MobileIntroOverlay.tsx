import { useEffect, useRef } from 'react';

import { getIntroVideoUrl } from '@/hooks/useMobileIntro';

type Props = {
  onDismiss: () => void;
  onError: () => void;
};

/** Intro vertical solo móvil (opción C): PC no la ve. */
export function MobileIntroOverlay({ onDismiss, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = getIntroVideoUrl();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    void v.play().catch(() => {
      /* autoplay bloqueado: el usuario puede pulsar Entrar */
    });
  }, [src]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex flex-col bg-black lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Presentación del club"
    >
      <video
        ref={videoRef}
        className="flex-1 w-full min-h-0 object-contain bg-black"
        src={src}
        muted
        playsInline
        autoPlay
        preload="auto"
        onError={onError}
        onEnded={onDismiss}
      />

      <div
        className="shrink-0 flex flex-col gap-3 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/90 to-transparent"
      >
        <button
          type="button"
          onClick={onDismiss}
          className="w-full rounded-full bg-primary py-3.5 font-label-caps text-label-caps text-[#000] touch-manipulation shadow-gold"
        >
          Entrar al sitio
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-2 font-body-md text-sm text-on-surface-variant touch-manipulation"
        >
          Saltar
        </button>
      </div>
    </div>
  );
}
