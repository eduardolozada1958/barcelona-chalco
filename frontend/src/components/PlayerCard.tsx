import type { Player } from '@/types';
import { MaterialIcon } from './MaterialIcon';

interface PlayerCardProps {
  player: Player;
}

/** Tarjeta pública: foto + nombre + descripción. La validación QR está en /credencial. */
export function PlayerCard({ player }: PlayerCardProps) {
  const fullName = `${player.first_name} ${player.last_name}`;

  return (
    <article className="flex flex-col bg-secondary-container/30 backdrop-blur-md rounded-2xl border border-primary/20 overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0" />

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
        <div
          className={`absolute top-4 right-4 font-stat-value text-headline-lg-mobile w-12 h-12 flex items-center justify-center rounded-lg ${
            player.is_verified
              ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(212,175,55,0.5)]'
              : 'bg-surface-container text-on-surface border border-outline-variant'
          }`}
        >
          {player.jersey_number ?? '—'}
        </div>
      </div>

      <div className="p-stack-md relative z-10 flex flex-col flex-grow">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">{fullName}</h2>
        <p className="font-label-caps text-label-caps text-primary tracking-widest mb-3">
          F.C. BARCELONA CUPIDO
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3">
          {player.sport_description ||
            `Jugador de la academia, temporada ${player.season || '2024-2025'}.`}
        </p>
      </div>
    </article>
  );
}
