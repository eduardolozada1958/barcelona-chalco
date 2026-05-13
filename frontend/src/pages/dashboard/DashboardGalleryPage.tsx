import { useQuery } from '@tanstack/react-query';

import { listGalleryAdmin } from '@/api/gallery';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

export function DashboardGalleryPage() {
  const q = useQuery({
    queryKey: ['gallery-admin'],
    queryFn: () => listGalleryAdmin({ page: 1, limit: 40 }),
  });
  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Galería</h1>
        <button className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2">
          <MaterialIcon name="add_photo_alternate" size={18} /> Subir
        </button>
      </div>

      <div className="grid gap-stack-sm sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((post) => (
          <div key={String(post.id)} className="bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl overflow-hidden hover:border-primary/30 transition-colors group">
            <div className="aspect-video bg-surface-container-high flex items-center justify-center">
              {post.image_url ? (
                <img src={String(post.image_url)} alt={String(post.title)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <MaterialIcon name="image" className="text-on-surface-variant/30" size={48} />
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium text-on-surface truncate">{String(post.title)}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-on-surface-variant">{String(post.media_type || 'image')}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-label-caps ${
                  post.is_published ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
                }`}>
                  {post.is_published ? 'Live' : 'Draft'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
