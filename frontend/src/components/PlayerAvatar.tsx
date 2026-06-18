import { MaterialIcon } from '@/components/MaterialIcon';
import { LazyMediaImage } from '@/components/LazyMediaImage';

type PlayerAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md';
  className?: string;
};

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function PlayerAvatar({ name, avatarUrl, size = 'md', className = '' }: PlayerAvatarProps) {
  const dim = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs';

  if (avatarUrl) {
    const px = size === 'sm' ? 64 : 80;
    return (
      <LazyMediaImage
        src={avatarUrl}
        optimize={{ width: px, height: px, quality: 75, resize: 'cover' }}
        alt=""
        className={`${dim} rounded-full object-cover border border-outline-variant/30 shrink-0 bg-surface-variant ${className}`}
      />
    );
  }

  const initials = initialsFromName(name);
  return (
    <span
      className={`${dim} rounded-full bg-primary/20 border border-primary/30 shrink-0 inline-flex items-center justify-center font-label-caps text-primary ${className}`}
      aria-hidden
    >
      {initials || <MaterialIcon name="person" size={size === 'sm' ? 16 : 18} className="text-on-surface-variant" />}
    </span>
  );
}
