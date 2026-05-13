import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { getGalleryPublic } from '@/api/gallery';
import { Spinner } from '@/components/Spinner';

export function PublicGalleryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({
    queryKey: ['gallery-public', id],
    queryFn:  () => getGalleryPublic(id!),
    enabled:  Boolean(id),
  });
  if (q.isLoading) return <Spinner />;
  const post = q.data?.data as Record<string, unknown> | undefined;
  if (!post) return <p className="p-8 text-white">Publicación no encontrada.</p>;
  const media = (post.gallery_media as Record<string, unknown>[] | undefined) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-white">
      <Link to="/galeria" className="text-sm text-primary hover:underline">
        ← Galería
      </Link>
      <h1 className="mt-4 font-headline-lg text-3xl font-bold">{String(post.title)}</h1>
      {post.caption ? <p className="mt-4 text-on-surface-variant">{String(post.caption)}</p> : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {media.map((m) => (
          <figure key={String(m.id)} className="overflow-hidden rounded-xl border border-outline-variant/20">
            {m.type === 'video' ? (
              <video src={String(m.url)} controls className="w-full" />
            ) : (
              <img src={String(m.url)} alt="" className="w-full object-cover" />
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}
