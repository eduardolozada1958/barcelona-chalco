import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { listGalleryPublic } from '@/api/gallery';
import { MaterialIcon } from '@/components/MaterialIcon';
import { SkeletonGrid } from '@/components/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/PageTransition';

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

/**
 * Galería pública — rejilla con título, fecha y descripción al pasar el cursor.
 */
export function PublicGalleryPage() {
  const q = useQuery({ queryKey: ['gallery-public'], queryFn: () => listGalleryPublic() });
  const items = (q.data?.data ?? []) as GalleryItem[];

  return (
    <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <header className="mb-stack-lg flex flex-col items-center text-center">
        <h1 className="font-display-hero text-display-hero text-primary mb-stack-sm">GALERÍA</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Fotos y videos que comparte el club con familias y jugadores: partidos, entrenamientos y momentos del equipo. Contenido revisado antes de publicarse.
        </p>
      </header>

      {q.isLoading ? (
        <SkeletonGrid count={6} type="player" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-stack-lg text-center">
          <MaterialIcon name="photo_library" className="text-on-surface-variant mb-4" size={64} />
          <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Galería vacía</p>
          <p className="font-body-md text-on-surface-variant">Próximamente se publicarán fotos y videos del club.</p>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {items.map((item) => {
            const imgUrl = galleryItemImageUrl(item);
            return (
              <StaggerItem key={item.id}>
                <Link
                  to={`/galeria/${item.id}`}
                  className="relative group aspect-square overflow-hidden bg-surface-container-low block"
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={item.title || 'Imagen de galería'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MaterialIcon name="image" className="text-surface-container-high" size={64} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-stack-md">
                    {item.published_at && (
                      <div className="font-label-caps text-label-caps text-primary mb-2">
                        {new Date(item.published_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }).toUpperCase()}
                      </div>
                    )}
                    <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
                      {item.title || 'Sin título'}
                    </div>
                    {item.caption && (
                      <p className="font-body-md text-body-md text-on-surface-variant mt-2 line-clamp-2">
                        {item.caption}
                      </p>
                    )}
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
}
