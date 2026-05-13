import { Link } from 'react-router-dom';
import type { Notice } from '@/types';
import { MaterialIcon } from './MaterialIcon';

interface NoticeCardProps {
  notice: Notice;
}

const typeConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  urgent:         { bg: 'bg-error/20',                text: 'text-error',              icon: 'warning',       label: 'Urgente' },
  event:          { bg: 'bg-secondary-container/20',   text: 'text-secondary-fixed-dim', icon: 'event',       label: 'Evento' },
  match:          { bg: 'bg-secondary-container/20',   text: 'text-secondary-fixed-dim', icon: 'sports_soccer',label: 'Partido' },
  training:       { bg: 'bg-surface-variant',          text: 'text-on-surface',         icon: 'fitness_center',label: 'Entrenamiento' },
  administrative: { bg: 'bg-surface-variant',          text: 'text-on-surface',         icon: 'assignment',    label: 'Administrativo' },
  general:        { bg: 'bg-surface-variant',          text: 'text-on-surface-variant', icon: 'campaign',      label: 'General' },
};

/**
 * Notice card matching the `avisosoficiales.html` mockup.
 */
export function NoticeCard({ notice }: NoticeCardProps) {
  const type = notice.type && typeConfig[notice.type] ? notice.type : 'general';
  const cfg = typeConfig[type];
  const isUrgent = type === 'urgent';
  const isBlue = type === 'urgent' || type === 'event' || type === 'match';
  const dateStr = notice.published_at
    ? new Date(notice.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <article
      className={`relative rounded-xl p-stack-md border shadow-lg group ${
        isBlue
          ? 'bg-[#002366]/40 backdrop-blur-md border-primary-container/20'
          : 'bg-surface-container-low border-outline-variant/20 shadow-md'
      }`}
    >
      {/* Urgent left bar */}
      {isUrgent && <div className="absolute top-0 left-0 w-1 h-full bg-error" />}

      {/* Header: badge + date */}
      <div className="flex justify-between items-start mb-stack-sm">
        <span
          className={`${cfg.bg} ${cfg.text} font-label-caps text-label-caps py-1 px-3 rounded-full flex items-center gap-1 border ${
            isUrgent ? 'border-error/30' : 'border-outline-variant/30'
          }`}
        >
          <MaterialIcon name={cfg.icon} size={12} /> {cfg.label}
        </span>
        <time className="font-body-md text-body-md text-on-surface-variant">{dateStr}</time>
      </div>

      {/* Title */}
      <h3 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-base group-hover:text-primary transition-colors">
        {notice.title}
      </h3>

      {/* Content preview */}
      <p className="font-body-md text-body-md text-on-surface-variant mb-stack-sm line-clamp-3">
        {notice.content}
      </p>

      {/* Read more */}
      <Link
        to={`/avisos/${notice.id}`}
        className="inline-flex items-center gap-2 text-primary font-label-caps text-label-caps hover:underline"
      >
        Leer más <MaterialIcon name="arrow_forward" size={14} />
      </Link>
    </article>
  );
}
