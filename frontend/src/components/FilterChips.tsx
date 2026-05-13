import clsx from 'clsx';

interface FilterChipsProps {
  options: { key: string; label: string; icon?: string }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function FilterChips({ options, active, onChange, className }: FilterChipsProps) {
  return (
    <div className={clsx('flex flex-wrap gap-base', className)}>
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={clsx(
            'px-6 py-2 rounded-full font-label-caps text-label-caps transition-all flex items-center gap-2',
            active === opt.key
              ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(212,175,55,0.2)]'
              : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
          )}
        >
          {opt.label}
          {opt.icon ? (
            <span className="material-symbols-outlined text-sm">{opt.icon}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
