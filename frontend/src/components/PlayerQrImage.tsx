import { useEffect, useRef, useState } from 'react';

import { playerQrImageUrl } from '@/api/qr';
import { MaterialIcon } from '@/components/MaterialIcon';

/** Tamaños en pantalla: el PNG del servidor es alto; aquí marco blanco amplio ayuda al “quiet zone” al escanear. */
const SIZE_CLASS = {
  sm: 'w-16 h-16 min-w-16 min-h-16',
  md: 'w-32 h-32 min-w-32 min-h-32',
  lg: 'w-44 h-44 min-w-44 min-h-44 sm:w-48 sm:h-48 sm:min-w-48 sm:min-h-48',
  /** Galería de credenciales: prioriza lectura móvil. */
  xl: 'w-48 h-48 min-w-48 min-h-48 sm:w-56 sm:h-56 sm:min-w-56 sm:min-h-56',
} as const;

/** Ancho PNG en servidor (2× retina del tamaño en pantalla). */
const QR_PIXEL_WIDTH: Record<keyof typeof SIZE_CLASS, number> = {
  sm: 192,
  md: 256,
  lg: 320,
  xl: 384,
};

interface PlayerQrImageProps {
  playerId: string;
  /** Token QR del jugador (obligatorio para cargar la imagen). */
  qrToken: string;
  /** Fecha de generación; invalida caché del navegador al renovar el QR. */
  cacheKey: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  /** Carga inmediata (primeras credenciales visibles). */
  priority?: boolean;
}

/**
 * QR único por jugador (generado en backend). Solo pide la imagen al entrar en viewport.
 */
export function PlayerQrImage({
  playerId,
  qrToken,
  cacheKey,
  size = 'md',
  className = '',
  priority = false,
}: PlayerQrImageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(priority);
  const [failed, setFailed] = useState(false);
  const dim = SIZE_CLASS[size];

  useEffect(() => {
    if (priority || visible) return;
    const el = rootRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '320px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, visible]);

  const src = visible
    ? `${playerQrImageUrl(playerId, qrToken, QR_PIXEL_WIDTH[size])}&v=${encodeURIComponent(cacheKey)}`
    : undefined;

  if (failed) {
    return (
      <div
        className={`${dim} ${className} rounded-xl border-2 border-dashed border-outline-variant/40 bg-white flex flex-col items-center justify-center p-2 text-center`}
      >
        <MaterialIcon name="qr_code_2" size={28} className="text-on-surface-variant/50" />
        <p className="text-[9px] text-on-surface-variant mt-1 leading-tight">QR no disponible</p>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`relative select-none [-webkit-user-select:none] [-webkit-touch-callout:none] ${dim} ${className}`}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      {!visible ? (
        <div
          className={`${dim} rounded-xl border-2 border-white bg-white/90 animate-pulse shadow-[0_0_0_1px_rgba(0,0,0,0.06)]`}
          aria-hidden
        />
      ) : (
        <img
          src={src}
          alt="Código QR del jugador"
          draggable={false}
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'low'}
          className={`${dim} rounded-xl border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)] object-contain pointer-events-none bg-white p-2 sm:p-2.5 [image-rendering:crisp-edges]`}
          onContextMenu={(e) => e.preventDefault()}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
