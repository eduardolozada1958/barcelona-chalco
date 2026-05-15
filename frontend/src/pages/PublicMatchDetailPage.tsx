import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { getMatchPublic } from '@/api/matches';
import { listPlayersPublic } from '@/api/players';
import { MatchFormationPitch } from '@/components/MatchFormationPitch';
import { MatchMapEmbed } from '@/components/MatchMapEmbed';
import { Spinner } from '@/components/Spinner';
import { lineupIdsToSlots } from '@/config/formations';
import { rosterRowToPitchPlayer, slotsToPitchPlayers } from '@/utils/lineup-players';

export function PublicMatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({
    queryKey: ['match-public', id],
    queryFn:  () => getMatchPublic(id!),
    enabled:  Boolean(id),
  });

  if (!id) return null;
  if (q.isLoading) return <Spinner />;
  const m = q.data?.data as Record<string, unknown> | undefined;
  if (!m) return <p className="p-8 text-white">Partido no encontrado.</p>;

  const mapUrl = typeof m.location_maps_url === 'string' ? m.location_maps_url : '';
  const formation = m.formation_type === 'football_7' || m.formation_type === 'football_11'
    ? m.formation_type as 'football_7' | 'football_11'
    : null;
  const rawLineup = Array.isArray(m.starting_lineup)
    ? (m.starting_lineup as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];

  const lineupQ = useQuery({
    queryKey: ['players-public-for-lineup', rawLineup],
    queryFn: () => listPlayersPublic({ limit: 50 }),
    enabled: rawLineup.length > 0 && Boolean(formation),
  });

  const pitchSlots = useMemo(() => {
    if (!formation || rawLineup.length === 0) return null;
    const roster = ((lineupQ.data?.data ?? []) as Record<string, unknown>[]).map(rosterRowToPitchPlayer);
    const slots = lineupIdsToSlots(rawLineup, formation);
    return slotsToPitchPlayers(slots, roster);
  }, [formation, rawLineup, lineupQ.data]);

  const matchDateStr = (() => {
    try {
      return new Date(String(m.match_date)).toLocaleString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return String(m.match_date); }
  })();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-white">
      <Link to="/partidos" className="text-sm text-primary hover:underline">
        ← Partidos
      </Link>
      <h1 className="mt-4 font-headline-lg text-3xl font-bold">{String(m.title)}</h1>
      <p className="mt-2 text-lg text-on-surface-variant">vs {String(m.opponent_name)}</p>
      <dl className="mt-8 space-y-2 text-sm">
        <Row label="Fecha" value={matchDateStr} />
        <Row label="Lugar" value={String(m.location)} />
        <Row label="Estado" value={String(m.status)} />
      </dl>
      {mapUrl ? <MatchMapEmbed url={mapUrl} className="mt-8" /> : null}
      {formation && pitchSlots ? (
        <div className="mt-10">
          <h2 className="font-headline-lg-mobile text-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
            <span className="text-primary">⚽</span>
            Once titular — {formation === 'football_7' ? 'Fútbol 7' : 'Fútbol 11'}
          </h2>
          <MatchFormationPitch
            formation={formation}
            slots={pitchSlots}
          />
        </div>
      ) : null}
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
