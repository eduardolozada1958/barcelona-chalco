import clsx from 'clsx';

interface StatBoxProps {
  value: string | number;
  label: string;
  highlight?: boolean;
  className?: string;
}

export function StatBox({ value, label, highlight, className }: StatBoxProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-lg p-stack-sm backdrop-blur-md border',
        highlight
          ? 'bg-secondary-container/30 border-primary/20 shadow-[inset_0_0_20px_rgba(212,175,55,0.05)]'
          : 'bg-surface-container/50 border-outline-variant/30',
        className
      )}
    >
      <span
        className={clsx(
          'font-stat-value text-stat-value mb-1',
          highlight ? 'text-primary' : 'text-on-surface'
        )}
      >
        {value}
      </span>
      <span
        className={clsx(
          'font-label-caps text-[10px] tracking-widest uppercase',
          highlight ? 'text-primary' : 'text-on-surface-variant'
        )}
      >
        {label}
      </span>
    </div>
  );
}
