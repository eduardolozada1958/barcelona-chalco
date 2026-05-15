import { CLUB_LOGO_URL } from '@/config/club';
import { MaterialIcon } from '@/components/MaterialIcon';

interface MatchTeamCrestProps {
  logoUrl?: string | null;
  name: string;
  variant?: 'home' | 'away';
  size?: 'md' | 'lg';
}

const SIZE = { md: 'w-16 h-16', lg: 'w-20 h-20' } as const;
const IMG = { md: 'w-12 h-12', lg: 'w-14 h-14' } as const;

/** Escudo circular para tarjetas de partido (club o rival). */
export function MatchTeamCrest({ logoUrl, name, variant = 'away', size = 'md' }: MatchTeamCrestProps) {
  const src = variant === 'home' ? CLUB_LOGO_URL : logoUrl;
  const border =
    variant === 'home'
      ? 'border-primary/30 shadow-gold'
      : 'border-outline-variant/50';

  return (
    <div
      className={`${SIZE[size]} rounded-full bg-surface-container flex items-center justify-center border ${border} overflow-hidden`}
    >
      {src ? (
        <img src={src} alt={name} className={`${IMG[size]} object-contain`} />
      ) : (
        <MaterialIcon
          name={variant === 'home' ? 'sports_soccer' : 'shield'}
          className={variant === 'home' ? 'text-primary' : 'text-on-surface-variant'}
          size={size === 'lg' ? 32 : 28}
          filled={variant === 'home'}
        />
      )}
    </div>
  );
}
