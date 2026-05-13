import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { getNoticePublic } from '@/api/notices';
import { Spinner } from '@/components/Spinner';

export function PublicNoticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({
    queryKey: ['notice-public', id],
    queryFn:  () => getNoticePublic(id!),
    enabled:  Boolean(id),
  });
  if (q.isLoading) return <Spinner />;
  const n = q.data?.data as Record<string, unknown> | undefined;
  if (!n) return <p className="p-8 text-white">Aviso no encontrado.</p>;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 text-white">
      <Link to="/avisos" className="text-sm text-primary hover:underline">
        ← Avisos
      </Link>
      <h1 className="mt-4 font-headline-lg text-3xl font-bold text-primary">{String(n.title)}</h1>
      <p className="mt-2 text-xs text-on-surface-variant">
        {String(n.type)} · {String(n.audience)}
      </p>
      <div className="mt-8 max-w-none whitespace-pre-wrap leading-relaxed text-on-surface-variant">{String(n.content)}</div>
    </article>
  );
}
