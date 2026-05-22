import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { SeasonLeaderRow } from '@/api/players';
import { SeasonLeadersTables } from '@/components/SeasonLeadersTables';
import {
  DEFAULT_VENUE_LEADER_ID,
  VENUE_LEADER_GROUPS,
  type VenueLeaderGroupId,
} from '@/config/venue-groups';
import { useDisplaySeason } from '@/hooks/useClubSettings';

export type VenueLeadersSectionProps = {
  variant?: 'public' | 'dashboard';
  linkPlayerNames?: boolean;
  getPlayerHref?: (playerId: string, row: SeasonLeaderRow) => string;
  limit?: number;
  /** Enlace opcional bajo las pestañas (p. ej. plantilla o resultados). */
  footerLink?: { to: string; label: string };
};

export function VenueLeadersSection({
  variant = 'public',
  linkPlayerNames = false,
  getPlayerHref,
  limit = 12,
  footerLink,
}: VenueLeadersSectionProps) {
  const season = useDisplaySeason();
  const [active, setActive] = useState<VenueLeaderGroupId>(DEFAULT_VENUE_LEADER_ID);
  const current = VENUE_LEADER_GROUPS.find((g) => g.id === active) ?? VENUE_LEADER_GROUPS[0];

  const titleClass =
    variant === 'public'
      ? 'font-display-hero text-headline-lg text-primary'
      : 'font-headline-lg text-headline-lg text-on-surface';

  return (
    <section className={variant === 'dashboard' ? 'mt-stack-lg pt-stack-lg border-t border-outline-variant/20' : ''}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-stack-md">
        <div className="max-w-2xl">
          <h2 className={titleClass}>Tablas de goleo por sede</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Temporada {season}. Elige la cancha para ver goleadores y tarjetas.
          </p>
        </div>
        {variant === 'public' ? (
          <Link
            to="/jugadores"
            className="text-primary font-label-caps text-label-caps hover:underline shrink-0"
          >
            Ver plantilla →
          </Link>
        ) : null}
      </div>

      <div
        className="flex flex-wrap gap-2 mb-4 p-1 rounded-xl bg-surface-container/50 border border-outline-variant/20 w-full sm:w-auto"
        role="tablist"
        aria-label="Sede para tabla de goleo"
      >
        {VENUE_LEADER_GROUPS.map((g) => {
          const selected = g.id === active;
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(g.id)}
              className={`flex-1 sm:flex-initial min-w-[8.5rem] px-4 py-2.5 rounded-lg text-sm font-label-caps transition-colors touch-manipulation ${
                selected
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/80'
              }`}
            >
              {g.tabLabel}
            </button>
          );
        })}
      </div>

      <div
        className="rounded-xl border border-outline-variant/20 bg-surface-container/30 p-4 sm:p-5"
        role="tabpanel"
        aria-label={current.tabLabel}
      >
        <p className="text-sm text-on-surface-variant mb-4">{current.description}</p>
        <SeasonLeadersTables
          embedded
          venue={current.id}
          variant={variant}
          limit={limit}
          linkPlayerNames={linkPlayerNames}
          getPlayerHref={getPlayerHref}
        />
      </div>

      {footerLink ? (
        <p className="mt-4 text-center sm:text-right">
          <Link to={footerLink.to} className="text-primary font-label-caps text-label-caps hover:underline">
            {footerLink.label}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
