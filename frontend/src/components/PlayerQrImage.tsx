import { playerQrImageUrl } from '@/api/qr';

/** Tamaños en pantalla: el PNG del servidor es alto; aquí marco blanco amplio ayuda al “quiet zone” al escanear. */
const SIZE_CLASS = {
  sm: 'w-16 h-16 min-w-16 min-h-16',
  md: 'w-32 h-32 min-w-32 min-h-32',
  lg: 'w-44 h-44 min-w-44 min-h-44 sm:w-48 sm:h-48 sm:min-w-48 sm:min-h-48',
  /** Galería de credenciales: prioriza lectura móvil. */
  xl: 'w-48 h-48 min-w-48 min-h-48 sm:w-56 sm:h-56 sm:min-w-56 sm:min-h-56',
} as const;

interface PlayerQrImageProps {
  playerId: string;
  qrToken: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}

/**
 * QR único por jugador (generado en backend). Sin enlace táctil ni selección de texto.
 */
export function PlayerQrImage({ playerId, qrToken, size = 'md', className = '' }: PlayerQrImageProps) {
  const dim = SIZE_CLASS[size];
  const src = `${playerQrImageUrl(playerId)}?v=${encodeURIComponent(qrToken)}`;

  return (
    <div
      className={`relative select-none [-webkit-user-select:none] [-webkit-touch-callout:none] ${dim} ${className}`}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      <img
        src={src}
        alt=""
        role="presentation"
        aria-hidden
        draggable={false}
        decoding="async"
        className={`${dim} rounded-xl border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)] object-contain pointer-events-none bg-white p-2 sm:p-2.5 [image-rendering:crisp-edges]`}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
