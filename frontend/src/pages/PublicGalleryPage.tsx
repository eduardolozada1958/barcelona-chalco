import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { listGalleryPublic } from '@/api/gallery';
import { GalleryCarousel, type GalleryCarouselSlide } from '@/components/GalleryCarousel';
import { MaterialIcon } from '@/components/MaterialIcon';
import { SkeletonGrid } from '@/components/Skeleton';

interface GalleryMediaRow {
  url?: string;
  type?: string;
}

interface GalleryItem {
  id: string;
  title?: string;
  caption?: string;
  image_url?: string;
  gallery_media?: GalleryMediaRow[];
  published_at?: string;
}

function galleryItemImageUrl(item: GalleryItem): string | null {
  const media = item.gallery_media;
  if (Array.isArray(media) && media.length > 0) {
    const url = media[0]?.url;
    if (typeof url === 'string' && url.length > 0) return url;
  }
  if (typeof item.image_url === 'string' && item.image_url.length > 0) return item.image_url;
  return null;
}

function formatGalleryDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  return new Date(iso)
    .toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase();
}

/**
 * Galería pública — carrusel de publicaciones (evita rejilla larga con muchas fotos).
 */
export function PublicGalleryPage() {
  const q = useQuery({ queryKey: ['gallery-public'], queryFn: () => listGalleryPublic() });
  const items = (q.data?.data ?? []) as GalleryItem[];

  const slides: GalleryCarouselSlide[] = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        imageUrl: galleryItemImageUrl(item),
        title: item.title || 'Sin título',
        caption: item.caption,
        dateLabel: formatGalleryDate(item.published_at),
        href: `/galeria/${item.id}`,
        mediaType: 'image',
      })),
    [items],
  );

  return (
    <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <header className="mb-stack-lg flex flex-col items-center text-center">
        <h1 className="font-display-hero text-display-hero text-primary mb-stack-sm">GALERÍA</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Fotos y videos del club. Desliza o usa las flechas para ver cada publicación; toca una miniatura o el
          bloque principal para ver todas las fotos del álbum.
        </p>
      </header>

      {q.isLoading ? (
        <SkeletonGrid count={3} type="player" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-stack-lg text-center">
          <MaterialIcon name="photo_library" className="text-on-surface-variant mb-4" size={64} />
          <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Galería vacía</p>
          <p className="font-body-md text-on-surface-variant">Próximamente se publicarán fotos y videos del club.</p>
        </div>
      ) : (
        <GalleryCarousel slides={slides} autoplaySec={7} />
      )}
    </div>
  );
}
