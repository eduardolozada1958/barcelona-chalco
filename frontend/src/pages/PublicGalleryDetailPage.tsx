import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { getGalleryPublic } from '@/api/gallery';
import { GalleryCarousel, type GalleryCarouselSlide } from '@/components/GalleryCarousel';
import { PageSeo } from '@/components/PageSeo';
import { Spinner } from '@/components/Spinner';
import { CommentsSection } from '@/components/CommentsSection';

export function PublicGalleryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({
    queryKey: ['gallery-public', id],
    queryFn: () => getGalleryPublic(id!),
    enabled: Boolean(id),
  });

  const post = q.data?.data as Record<string, unknown> | undefined;

  const slides: GalleryCarouselSlide[] = useMemo(() => {
    if (!post) return [];
    const media = (post.gallery_media as Record<string, unknown>[] | undefined) ?? [];
    return media.map((m) => ({
      id: String(m.id),
      imageUrl: typeof m.url === 'string' ? m.url : null,
      title: String(post.title ?? ''),
      mediaType: m.type === 'video' ? 'video' : 'image',
    }));
  }, [post]);

  if (q.isLoading) return <Spinner />;
  if (!post) return <p className="p-8 text-white">Publicación no encontrada.</p>;

  const media = (post.gallery_media as Record<string, unknown>[] | undefined) ?? [];
  const firstImage = media.find((m) => m.type !== 'video')?.url;
  const imgUrl = typeof firstImage === 'string' ? firstImage : null;

  return (
    <div className="mx-auto max-w-5xl px-margin-mobile md:px-margin-desktop py-stack-lg text-white">
      <PageSeo
        title={String(post.title)}
        description={post.caption ? String(post.caption).slice(0, 160) : `Galería — F.C. Barcelona Cupido`}
        path={`/galeria/${id}`}
        image={imgUrl}
      />
      <Link to="/galeria" className="text-sm text-primary hover:underline font-label-caps">
        ← Volver a galería
      </Link>
      <h1 className="mt-4 font-display-hero text-headline-lg text-primary">{String(post.title)}</h1>
      {post.caption ? (
        <p className="mt-3 text-on-surface-variant max-w-2xl">{String(post.caption)}</p>
      ) : null}

      <div className="mt-8">
        <GalleryCarousel slides={slides} autoplaySec={0} />
      </div>

      {media.length > 1 ? (
        <p className="mt-4 text-center text-xs text-on-surface-variant">
          {media.length} archivos en este álbum · flechas del teclado o miniaturas para navegar
        </p>
      ) : null}

      {id ? (
        <div className="mt-10">
          <CommentsSection resourceType="gallery_post" resourceId={id} />
        </div>
      ) : null}
    </div>
  );
}
