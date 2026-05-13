import { useQuery } from '@tanstack/react-query';

import { listGalleryPublic } from '@/api/gallery';
import { MaterialIcon } from '@/components/MaterialIcon';
import { SkeletonGrid } from '@/components/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/PageTransition';

interface GalleryItem {
  id: string;
  title?: string;
  description?: string;
  image_url?: string;
  media_type?: string;
  published_at?: string;
}

/**
 * Public gallery page – faithful translation of `galeria.html` mockup.
 * Masonry-style grid with hover overlay showing title, date, and description.
 */
export function PublicGalleryPage() {
  const q = useQuery({ queryKey: ['gallery-public'], queryFn: () => listGalleryPublic() });
  const items = (q.data?.data ?? []) as GalleryItem[];

  return (
    <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      {/* Header */}
      <header className="mb-stack-lg flex flex-col items-center text-center">
        <h1 className="font-display-hero text-display-hero text-primary mb-stack-sm">GALERÍA</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          La historia visual de FutID Barcelona Chalco. Momentos élite, posters de jornada y acceso tras bastidores.
        </p>
      </header>

      {/* Grid */}
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
          {items.map((item) => (
            <StaggerItem key={item.id}>
              <div className="relative group aspect-square overflow-hidden bg-surface-container-low cursor-pointer">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title || 'Gallery'}
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
                      {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </div>
                  )}
                  <div className="font-headline-lg-mobile text-headline-lg-mobile text-on-background">
                    {item.title || 'Sin título'}
                  </div>
                  {item.description && (
                    <p className="font-body-md text-body-md text-on-surface-variant mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
