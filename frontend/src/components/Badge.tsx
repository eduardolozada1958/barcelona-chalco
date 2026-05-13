import clsx from 'clsx';

interface BadgeProps {
  variant: 'verified' | 'urgent' | 'home' | 'away' | 'training' | 'convocatoria' | 'general' | 'active';
  label?: string;
  className?: string;
}

const variantStyles: Record<BadgeProps['variant'], string> = {
  verified:      'bg-primary/10 text-primary border-primary/30',
  urgent:        'bg-error/20 text-error border-error/30',
  home:          'bg-primary/10 text-primary border-primary/30',
  away:          'bg-primary/10 text-primary border-primary/30',
  training:      'bg-surface-variant text-on-surface border-outline-variant/30',
  convocatoria:  'bg-secondary-container/20 text-secondary-fixed-dim border-secondary-container/30',
  general:       'bg-surface-variant text-on-surface-variant border-outline-variant/30',
  active:        'bg-secondary-fixed/20 text-secondary-fixed border-secondary-fixed/30',
};

const variantIcons: Record<BadgeProps['variant'], string | null> = {
  verified:     'verified',
  urgent:       'warning',
  home:         null,
  away:         null,
  training:     'sports_soccer',
  convocatoria: 'groups',
  general:      'campaign',
  active:       'bolt',
};

const variantLabels: Record<BadgeProps['variant'], string> = {
  verified:     'Verificado',
  urgent:       'Urgent',
  home:         'HOME',
  away:         'AWAY',
  training:     'Training',
  convocatoria: 'Convocatoria',
  general:      'General',
  active:       'Registro Activo',
};

export function Badge({ variant, label, className }: BadgeProps) {
  const icon = variantIcons[variant];
  const text = label ?? variantLabels[variant];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 border px-3 py-1 rounded-full font-label-caps text-label-caps',
        variantStyles[variant],
        className
      )}
    >
      {icon ? (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '14px', fontVariationSettings: variant === 'verified' ? "'FILL' 1" : undefined }}
        >
          {icon}
        </span>
      ) : null}
      {text}
    </span>
  );
}
