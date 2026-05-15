import { Link } from 'react-router-dom';
import type { Result, Match, MatchOutcome } from '@/types';
import { MaterialIcon } from './MaterialIcon';

function outcomeLabelEs(outcome: MatchOutcome | string | null | undefined): string {
  switch (outcome) {
    case 'win':
      return 'Victoria';
    case 'loss':
      return 'Derrota';
    case 'draw':
      return 'Empate';
    default:
      return '—';
  }
}

interface ResultCardProps {
  result: Result;
  match?: Match;
}

/**
 * Result card matching the `resultados.html` mockup.
 * Uses Result.goals_scored / goals_conceded plus optional Match metadata.
 */
export function ResultCard({ result, match }: ResultCardProps) {
  const goalsScored = result.goals_scored;
  const goalsConceded = result.goals_conceded;
  const isWin = result.outcome === 'win';
  const dateStr = match?.match_date
    ? new Date(match.match_date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
    : result.published_at
      ? new Date(result.published_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
      : '—';

  return (
    <article className="pro-card rounded-xl p-stack-md flex flex-col gap-stack-sm hover:-translate-y-1 transition-transform duration-300">
      {/* Header: date + outcome badge */}
      <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
        <span className="font-label-caps text-label-caps text-on-surface-variant">{dateStr}</span>
        <span className={`font-label-caps text-label-caps px-2 py-1 rounded ${
          isWin ? 'bg-primary/10 text-primary' : result.outcome === 'loss' ? 'bg-error/10 text-error' : 'bg-surface-variant text-on-surface-variant'
        }`}>
          {outcomeLabelEs(result.outcome as MatchOutcome | undefined)}
        </span>
      </div>

      {/* Scoreboard */}
      <div className="flex justify-between items-center py-4">
        <div className="text-center flex-1">
          <div className="font-headline-lg text-headline-lg text-on-surface">FBC</div>
          <div className={`font-stat-value text-stat-value mt-2 ${isWin ? 'text-primary' : 'text-on-surface'}`}>
            {goalsScored}
          </div>
        </div>
        <div className="font-label-caps text-label-caps text-on-surface-variant px-4">VS</div>
        <div className="text-center flex-1">
          <div className="font-headline-lg text-headline-lg text-on-surface-variant">
            {match?.opponent_name ? match.opponent_name.slice(0, 3).toUpperCase() : 'OPP'}
          </div>
          <div className={`font-stat-value text-stat-value mt-2 text-on-surface-variant`}>
            {goalsConceded}
          </div>
        </div>
      </div>

      {/* Venue */}
      <div className="text-center mb-4">
        <span className="font-body-md text-body-md text-on-surface-variant">
          {match?.location || 'Sede por confirmar'}
        </span>
      </div>

      {/* Match report snippet */}
      {result.match_report && (
        <p className="font-body-md text-body-md text-on-surface-variant mt-2 text-sm line-clamp-2">
          {result.match_report}
        </p>
      )}

      {/* Link */}
      {result.match_id && (
        <Link
          to={`/resultados/${result.id}`}
          className="mt-auto pt-4 text-primary font-label-caps text-label-caps flex items-center gap-1 hover:text-white transition-colors"
        >
          Ver detalle del partido <MaterialIcon name="arrow_forward" size={16} />
        </Link>
      )}
    </article>
  );
}
