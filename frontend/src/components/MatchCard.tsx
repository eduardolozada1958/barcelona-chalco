import { Link } from 'react-router-dom';
import type { Match } from '@/types';
import { MaterialIcon } from './MaterialIcon';

interface MatchCardProps {
  match: Match;
}

/**
 * Match card matching the `partidos.html` mockup.
 * Features: date/time header, team crests VS, venue info, CTA.
 */
export function MatchCard({ match }: MatchCardProps) {
  const matchDate = match.match_date
    ? new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
    : '—';
  const matchTime = match.match_date
    ? new Date(match.match_date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) + ' HRS'
    : '—';

  return (
    <div className="bg-[#002366]/40 backdrop-blur-md rounded-xl border border-primary-container/20 p-stack-md relative overflow-hidden group">
      {/* Decorative glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />

      <div className="flex flex-col gap-stack-md relative z-10">
        {/* Date / Time header */}
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-stack-sm">
          <div className="flex items-center gap-base text-primary">
            <MaterialIcon name="calendar_month" size={20} />
            <span className="font-label-caps text-label-caps">{matchDate}</span>
          </div>
          <div className="flex items-center gap-base text-on-surface-variant">
            <MaterialIcon name="schedule" size={20} />
            <span className="font-label-caps text-label-caps">{matchTime}</span>
          </div>
        </div>

        {/* Teams VS */}
        <div className="flex justify-between items-center py-stack-sm">
          <div className="flex flex-col items-center gap-stack-sm w-1/3">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center border border-primary/30 shadow-gold">
              <MaterialIcon name="sports_soccer" className="text-primary" size={28} filled />
            </div>
            <span className="font-headline-lg-mobile text-headline-lg-mobile text-center">FC Chalco</span>
          </div>
          <div className="font-stat-value text-stat-value text-outline-variant px-stack-md">VS</div>
          <div className="flex flex-col items-center gap-stack-sm w-1/3">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/50">
              {match.opponent_logo_url ? (
                <img src={match.opponent_logo_url} alt={match.opponent_name} className="w-10 h-10 object-contain" />
              ) : (
                <MaterialIcon name="shield" className="text-on-surface-variant" size={28} />
              )}
            </div>
            <span className="font-headline-lg-mobile text-headline-lg-mobile text-center text-on-surface-variant">
              {match.opponent_name || 'Rival'}
            </span>
          </div>
        </div>

        {/* Venue info */}
        <div className="grid grid-cols-2 gap-stack-sm bg-surface-container/50 p-stack-sm rounded-lg border border-outline-variant/20 mt-stack-sm">
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">SEDE</span>
            <span className="font-body-md text-body-md text-on-surface truncate">{match.location || '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-on-surface-variant mb-1">CATEGORÍA</span>
            <span className="font-body-md text-body-md text-on-surface truncate">{match.category || '—'}</span>
          </div>
        </div>

        {/* CTA */}
        <Link
          to={`/partidos/${match.id}`}
          className="w-full mt-stack-sm py-3 border-2 border-primary text-primary font-label-caps text-label-caps rounded-md hover:bg-primary/10 transition-colors flex items-center justify-center gap-base"
        >
          VER DETALLES
          <MaterialIcon name="arrow_forward" />
        </Link>
      </div>
    </div>
  );
}
