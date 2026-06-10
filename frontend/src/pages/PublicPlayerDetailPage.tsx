import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getPlayerPublic } from '@/api/players';
import type { ApiResponse } from '@/api/types';
import { findCachedPublicPlayer } from '@/utils/player-prefetch';
import type { Player } from '@/types';
import { PlayerHighlightBadge, PlayerProfileCelebration } from '@/components/PlayerProfileCelebration';
import { usePlayerHighlights } from '@/hooks/usePlayerHighlights';
import { MaterialIcon } from '@/components/MaterialIcon';
import { StatBox } from '@/components/StatBox';
import { Badge } from '@/components/Badge';
import { Spinner } from '@/components/Spinner';
import { PageSeo } from '@/components/PageSeo';
import { absoluteUrl } from '@/config/seo';
import { isPlayerUuid, playerPublicPath } from '@/utils/player-path';
import { useDisplaySeason } from '@/hooks/useClubSettings';
import { calcAgeFromBirthDate, formatBirthDateEs } from '@/utils/birth-date';

/**
 * Player detail page – faithful translation of `perfiljugador.html` mockup.
 * Split layout: image left, stats + bio right. Below: QR identity + verification panel.
 */
export function PublicPlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const displaySeason = useDisplaySeason();
  const cached = id ? findCachedPublicPlayer(queryClient, id) : undefined;
  const q = useQuery({
    queryKey: ['player-public', id],
    queryFn: () => getPlayerPublic(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
    placeholderData: cached
      ? ({ success: true, data: cached, message: '' } satisfies ApiResponse<Player>)
      : undefined,
  });

  const player = q.data?.data as Player | undefined;
  const highlights = usePlayerHighlights(player?.id, player?.slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!player || !id) return;
    const slug = player.slug?.trim();
    if (slug && isPlayerUuid(id) && id !== slug) {
      navigate(`/jugadores/${slug}`, { replace: true });
    }
  }, [player, id, navigate]);

  if (q.isLoading) return <Spinner />;

  const playerSeo = player ? (
    <PageSeo
      title={`${player.first_name} ${player.last_name}`}
      description={`Perfil de ${player.first_name} ${player.last_name} en F.C. Barcelona Cupido: posición ${player.position}, categoría ${player.category}, estadísticas y credencial digital.`}
      path={playerPublicPath(player)}
      image={player.avatar_url}
      type="profile"
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: `${player.first_name} ${player.last_name}`,
        url: absoluteUrl(playerPublicPath(player)),
        image: player.avatar_url ?? undefined,
        memberOf: { '@type': 'SportsTeam', name: 'F.C. Barcelona Cupido' },
      }}
    />
  ) : null;

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <MaterialIcon name="person_off" className="text-on-surface-variant mb-4" size={64} />
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Jugador no encontrado</h2>
        <Link to="/jugadores" className="text-primary font-label-caps text-label-caps hover:underline mt-4">
          ← Volver a jugadores
        </Link>
      </div>
    );
  }

  const fullName = `${player.first_name} ${player.last_name}`;
  const age = player.birth_date ? (calcAgeFromBirthDate(player.birth_date) ?? '—') : '—';

  return (
    <div className="pt-4 pb-stack-lg px-margin-mobile md:px-margin-desktop w-full max-w-[1280px] mx-auto">
      {playerSeo}
      {/* ═══════ Hero Section ═══════ */}
      <section className="relative w-full rounded-xl overflow-hidden mb-stack-lg bg-surface-container-low shadow-card-deep border border-outline-variant/30 grid grid-cols-1 md:grid-cols-[minmax(220px,280px)_1fr] gap-6 md:gap-8 p-4 md:p-6 md:items-start">
        {!highlights.loading && highlights.kind ? (
          <div className="md:col-span-2 relative min-h-0">
            <PlayerProfileCelebration
              playerId={player.id}
              playerName={fullName}
              kind={highlights.kind}
              weekLabel={highlights.weekLabel}
              goals={highlights.goals}
              scorerRank={highlights.scorerRank}
            />
          </div>
        ) : null}
        {/* Foto retrato 3:4 — altura acotada, no crece con el panel derecho */}
        <div className="flex justify-center md:justify-start">
          <div className="relative w-[min(100%,260px)] aspect-[3/4] rounded-xl overflow-hidden bg-surface-container-lowest border border-outline-variant/25 shadow-md">
            {player.avatar_url ? (
              <img
                src={player.avatar_url}
                alt={`Foto de ${fullName}`}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-surface-container-low to-surface-container">
                <MaterialIcon name="person" className="text-on-surface-variant/40" size={72} />
                <span className="text-xs text-on-surface-variant font-label-caps">Sin foto</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
            {player.jersey_number != null ? (
              <span className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary font-stat-value text-lg shadow-lg">
                {player.jersey_number}
              </span>
            ) : null}
          </div>
        </div>

        {/* Datos del jugador */}
        <div className="relative min-w-0 flex flex-col md:border-l border-outline-variant/10 md:pl-6 pt-2 md:pt-0">
          <div className="mb-stack-md space-y-3 min-w-0">
            {!highlights.loading && highlights.kind ? (
              <PlayerHighlightBadge kind={highlights.kind} />
            ) : null}
            <h1 className="font-display-hero text-[clamp(1.2rem,4.2vw,2.75rem)] leading-[1.08] text-on-surface tracking-tighter break-words">
              <span className="block">{player.first_name.toUpperCase()}</span>
              <span className="block text-primary">{player.last_name.toUpperCase()}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {player.is_verified ? <Badge variant="verified" /> : null}
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                Temporada {displaySeason}
              </span>
            </div>
            <p className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-2">
              <MaterialIcon name="sports_soccer" className="text-primary shrink-0" size={16} />
              {player.position?.toUpperCase() || 'JUGADOR'}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-base mb-stack-md">
            <StatBox value={player.height_cm ?? '—'} label="Estatura (cm)" />
            <StatBox value={player.weight_kg ?? '—'} label="Peso (kg)" highlight />
            <StatBox value={player.jersey_number ?? '—'} label="Número" />
          </div>

          {/* Personal info */}
          <div className="space-y-4 mb-stack-lg border-t border-b border-outline-variant/20 py-stack-md">
            {[
              { label: 'Fecha de nacimiento', value: player.birth_date ? formatBirthDateEs(player.birth_date) : '—' },
              { label: 'Edad', value: age },
              { label: 'Club', value: 'Barcelona Cupido' },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={`flex justify-between items-center ${i < arr.length - 1 ? 'border-b border-outline-variant/10 pb-2' : ''}`}
              >
                <span className="font-label-caps text-[11px] text-on-surface-variant tracking-wider">{row.label}</span>
                <span className="font-body-md text-on-surface font-medium">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Biography */}
          <div className="mb-stack-lg">
            <h3 className="font-label-caps text-label-caps text-primary mb-3 flex items-center gap-2">
              <MaterialIcon name="notes" size={16} /> Descripción deportiva
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {player.sport_description || 'Sin descripción deportiva disponible.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
