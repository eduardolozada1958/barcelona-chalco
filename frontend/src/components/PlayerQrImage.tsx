import { playerQrImageUrl } from '@/api/qr';

const SIZE_CLASS = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-44 h-44',
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
        className={`${dim} rounded-lg border border-primary/20 object-contain pointer-events-none bg-white p-0.5`}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
