import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { getMatchPublic } from '@/api/matches';
import { Spinner } from '@/components/Spinner';

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-white">
      <Link to="/partidos" className="text-sm text-primary hover:underline">
        ← Partidos
      </Link>
      <h1 className="mt-4 font-headline-lg text-3xl font-bold">{String(m.title)}</h1>
      <p className="mt-2 text-lg text-on-surface-variant">vs {String(m.opponent_name)}</p>
      <dl className="mt-8 space-y-2 text-sm">
        <Row label="Fecha" value={String(m.match_date)} />
        <Row label="Lugar" value={String(m.location)} />
        <Row label="Categoría" value={String(m.category)} />
        <Row label="Estado" value={String(m.status)} />
      </dl>
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
