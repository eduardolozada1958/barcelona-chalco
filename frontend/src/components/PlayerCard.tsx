import { Link } from 'react-router-dom';
import type { Player } from '@/types';
import { PlayerQrImage } from '@/components/PlayerQrImage';
import { MaterialIcon } from './MaterialIcon';

interface PlayerCardProps {
  player: Player;
}

/**
 * Premium player card matching the `jugadores.html` mockup.
 * Features: portrait photo, jersey number badge, description, stats grid,
 * verification status with folio, mini QR, and CTA button.
 */
export function PlayerCard({ player }: PlayerCardProps) {
  const fullName = `${player.first_name} ${player.last_name}`;
  const positionAbbr = getPositionAbbr(player.position);
  const age = player.birth_date ? calculateAge(player.birth_date) : '—';
  const isVerified = player.is_verified;

  return (
    <article className="flex flex-col bg-secondary-container/30 backdrop-blur-md rounded-2xl border border-primary/20 overflow-hidden relative group">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0" />

      {/* Portrait */}
      <div className="h-64 relative z-10 overflow-hidden bg-surface-container-lowest">
        {player.avatar_url ? (
          <img
            src={player.avatar_url}
            alt={`Retrato de ${fullName}`}
            className="w-full h-full object-cover object-top mix-blend-luminosity opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MaterialIcon name="person" className="text-surface-container-high" size={80} />
          </div>
        )}
        {/* Jersey number badge */}
        <div
          className={`absolute top-4 right-4 font-stat-value text-headline-lg-mobile w-12 h-12 flex items-center justify-center rounded-lg ${
            isVerified
              ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(212,175,55,0.5)]'
              : 'bg-surface-container text-on-surface border border-outline-variant'
          }`}
        >
          {player.jersey_number ?? '—'}
        </div>
      </div>

      {/* Info section */}
      <div className="p-stack-md relative z-10 flex flex-col flex-grow">
        {/* Name + Club */}
        <div className="mb-4">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">{fullName}</h2>
          <p className="font-label-caps text-label-caps text-primary tracking-widest">
            F.C. BARCELONA CUPIDO
          </p>
        </div>

        {/* Description */}
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-sm flex-grow line-clamp-2">
          {player.sport_description || `Jugador de la categoría ${player.category || '—'}, temporada ${player.season || '2024-2025'}.`}
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-stack-md py-4 border-y border-outline-variant/30">
          <div className="flex flex-col items-center justify-center">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Posición</span>
            <span className="font-stat-value text-headline-lg-mobile text-on-surface">{positionAbbr}</span>
          </div>
          <div className="flex flex-col items-center justify-center border-x border-outline-variant/30">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Edad</span>
            <span className="font-stat-value text-headline-lg-mobile text-on-surface">{age}</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">Temp</span>
            <span className="font-stat-value text-headline-lg-mobile text-on-surface">
              {player.season ? player.season.replace('20', '').replace('-20', '/') : '24/25'}
            </span>
          </div>
        </div>

        {/* Verification row */}
        <div className="flex items-center justify-between mb-stack-md bg-surface-container/50 p-3 rounded-lg border border-outline-variant/20">
          <div className="flex items-center gap-3">
            <MaterialIcon
              name={isVerified ? 'verified' : 'pending'}
              className={isVerified ? 'text-primary' : 'text-on-surface-variant'}
              filled={isVerified}
            />
            <div className="flex flex-col">
              <span className="font-body-md text-sm text-on-surface">
                {isVerified ? 'Jugador Verificado' : 'Pendiente de verificación'}
              </span>
              {player.qr_token && (
                <span className="font-label-caps text-[10px] text-on-surface-variant">
                  Folio: FCB-{player.jersey_number ?? '00'}
                </span>
              )}
            </div>
          </div>
          {player.qr_token ? (
            <PlayerQrImage playerId={player.id} qrToken={player.qr_token} size="sm" />
          ) : null}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-2">
          <Link
            to={`/jugadores/${player.id}`}
            className="w-full py-3 bg-surface-container border border-primary/50 text-primary font-label-caps text-label-caps rounded-lg text-center hover:bg-primary hover:text-on-primary transition-all duration-300"
          >
            Ver perfil completo
          </Link>
          {player.qr_token && player.is_verified ? (
            <Link
              to="/credencial"
              className="w-full py-3 border border-outline-variant/40 text-on-surface-variant font-label-caps text-[11px] rounded-lg text-center hover:border-primary/50 hover:text-primary transition-colors"
            >
              Ver credencial con QR
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/* ── Helpers ── */
function getPositionAbbr(position?: string): string {
  if (!position) return '—';
  const map: Record<string, string> = {
    'Portero': 'POR',
    'Defensa Central': 'DEF',
    'Lateral Izquierdo': 'LAT',
    'Lateral Derecho': 'LAT',
    'Extremo Izquierdo': 'EXT',
    'Extremo Derecho': 'EXT',
    'Mediocampista': 'MED',
    'Delantero': 'DEL',
  };
  return map[position] ?? position.slice(0, 3).toUpperCase();
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const bday = new Date(birthDate);
  let age = today.getFullYear() - bday.getFullYear();
  const m = today.getMonth() - bday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--;
  return age;
}
