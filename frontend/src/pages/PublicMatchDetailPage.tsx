import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { getMatchPublic } from '@/api/matches';
import { fetchPlayersPublicByIds } from '@/api/players';
import { MatchFormationPitch } from '@/components/MatchFormationPitch';
import { MatchMapEmbed } from '@/components/MatchMapEmbed';
import { MatchTeamCrest } from '@/components/MatchTeamCrest';
import { CLUB_DISPLAY_NAME } from '@/config/club';
import { Spinner } from '@/components/Spinner';
import { lineupIdsToSlots } from '@/config/formations';
import {
  displayPlayerName,
  rosterRowToPitchPlayer,
  slotsToPitchPlayers,
  type PitchPlayer,
} from '@/utils/lineup-players';

function parseFormation(raw: unknown): 'football_7' | 'football_11' | null {
  return raw === 'football_7' || raw === 'football_11' ? raw : null;
}

function parseLineupIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

function formatMatchDate(raw: unknown): string {
  try {
    return new Date(String(raw)).toLocaleString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(raw ?? '');
  }
}

export function PublicMatchDetailPage() {
  const { id } = useParams<{ id: string }>();

  const matchQ = useQuery({
    queryKey: ['match-public', id],
    queryFn: () => getMatchPublic(id!),
    enabled: Boolean(id),
  });

  const m = matchQ.data?.data as Record<string, unknown> | undefined;
  const formation = m ? parseFormation(m.formation_type) : null;
  const rawLineup = m ? parseLineupIds(m.starting_lineup) : [];
  const hasLineup = Boolean(formation) && rawLineup.length > 0;

  const lineupQ = useQuery({
    queryKey: ['match-lineup-players', id, rawLineup.join(',')],
    queryFn: async () => {
      const rows = await fetchPlayersPublicByIds(rawLineup);
      return rows.map(rosterRowToPitchPlayer);
    },
    enabled: Boolean(id) && hasLineup,
  });

  const pitchSlots = useMemo((): (PitchPlayer | null)[] | null => {
    if (!formation || rawLineup.length === 0) return null;
    const roster = lineupQ.data ?? [];
    const slots = lineupIdsToSlots(rawLineup, formation);
    return slotsToPitchPlayers(slots, roster);
  }, [formation, rawLineup, lineupQ.data]);

  if (!id) return null;
  if (matchQ.isLoading) return <Spinner />;
  if (!m) return <p className="p-8 text-white">Partido no encontrado.</p>;

  const mapUrl = typeof m.location_maps_url === 'string' ? m.location_maps_url : '';
  const matchDateStr = formatMatchDate(m.match_date);
  const filledCount = pitchSlots?.filter(Boolean).length ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-white">
      <Link to="/partidos" className="text-sm text-primary hover:underline">
        ← Partidos
      </Link>
      <h1 className="mt-4 font-headline-lg text-3xl font-bold">{String(m.title)}</h1>
      <div className="mt-6 flex justify-center items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <MatchTeamCrest name={CLUB_DISPLAY_NAME} variant="home" size="lg" />
          <span className="text-sm font-semibold">{CLUB_DISPLAY_NAME}</span>
        </div>
        <span className="font-stat-value text-2xl text-outline-variant">VS</span>
        <div className="flex flex-col items-center gap-2">
          <MatchTeamCrest
            name={String(m.opponent_name ?? 'Rival')}
            logoUrl={typeof m.opponent_logo_url === 'string' ? m.opponent_logo_url : null}
            variant="away"
            size="lg"
          />
          <span className="text-sm text-on-surface-variant">{String(m.opponent_name)}</span>
        </div>
      </div>
      <dl className="mt-8 space-y-2 text-sm">
        <Row label="Fecha" value={matchDateStr} />
        <Row label="Lugar" value={String(m.location)} />
        <Row label="Estado" value={String(m.status)} />
      </dl>

      {hasLineup ? (
        <section className="mt-10" aria-labelledby="lineup-heading">
          <h2
            id="lineup-heading"
            className="font-headline-lg-mobile text-lg font-semibold text-on-surface mb-3 flex items-center gap-2"
          >
            <span className="text-primary" aria-hidden>⚽</span>
            Cuadro titular — {formation === 'football_7' ? 'Fútbol 7' : 'Fútbol 11'}
          </h2>
          {lineupQ.isLoading ? (
            <div className="py-8 flex justify-center">
              <Spinner />
            </div>
          ) : pitchSlots ? (
            <>
              <MatchFormationPitch formation={formation!} slots={pitchSlots} />
              <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {pitchSlots.map((player, idx) => (
                  <li
                    key={`${idx}-${player?.id ?? 'empty'}`}
                    className="px-2 py-1.5 rounded bg-surface-container/40 border border-outline-variant/20 text-on-surface"
                  >
                    <span className="text-primary font-semibold">{idx + 1}.</span>{' '}
                    {player ? displayPlayerName(player) : '—'}
                    {player?.jerseyNumber != null ? (
                      <span className="text-on-surface-variant"> · #{player.jerseyNumber}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {filledCount < rawLineup.length ? (
                <p className="mt-2 text-[11px] text-on-surface-variant">
                  Algunos jugadores no están disponibles en el listado público.
                </p>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      {mapUrl ? <MatchMapEmbed url={mapUrl} className="mt-8" /> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-outline-variant/20 py-2">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
