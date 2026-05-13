import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

/**
 * M3-compliant skeleton shimmer loader.
 * Uses the `skeleton-shimmer` animation defined in index.css.
 */
export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  const base = 'animate-pulse bg-surface-container-high/60 rounded';
  const shape = {
    text:        'h-4 w-3/4 rounded',
    circular:    'rounded-full',
    rectangular: 'rounded-lg',
    card:        'rounded-xl',
  }[variant];

  return <div className={clsx(base, shape, className)} />;
}

/** Pre-built skeleton for a player card */
export function PlayerCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface-container/30 rounded-2xl border border-outline-variant/20 overflow-hidden">
      <Skeleton variant="rectangular" className="h-64 w-full rounded-none" />
      <div className="p-6 space-y-4">
        <Skeleton variant="text" className="h-6 w-2/3" />
        <Skeleton variant="text" className="h-4 w-1/2" />
        <div className="grid grid-cols-3 gap-2 py-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}

/** Pre-built skeleton for a result/match card */
export function CardSkeleton() {
  return (
    <div className="bg-surface-container/30 rounded-xl border border-outline-variant/20 p-6 space-y-4">
      <div className="flex justify-between">
        <Skeleton variant="text" className="h-3 w-24" />
        <Skeleton variant="text" className="h-3 w-16" />
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton variant="text" className="h-4 w-1/2 mx-auto" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

/** Grid of skeleton cards */
export function SkeletonGrid({ count = 6, type = 'card' }: { count?: number; type?: 'card' | 'player' }) {
  const Component = type === 'player' ? PlayerCardSkeleton : CardSkeleton;
  return (
    <div className={clsx(
      'grid gap-gutter',
      type === 'player'
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-1 lg:grid-cols-2'
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
