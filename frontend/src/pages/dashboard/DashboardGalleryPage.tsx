import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { createGalleryPost, listGalleryAdmin, publishGalleryPost, type CreateGalleryPostBody } from '@/api/gallery';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

type GalleryForm = {
  title: string;
  caption: string;
  type: NonNullable<CreateGalleryPostBody['type']>;
};

function firstMediaUrl(post: Record<string, unknown>): string | null {
  const media = post.gallery_media;
  if (!Array.isArray(media) || media.length === 0) return null;
  const first = media[0] as Record<string, unknown>;
  const url = first?.url;
  return typeof url === 'string' ? url : null;
}

export function DashboardGalleryPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('crear') === '1') {
      setCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('crear');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const q = useQuery({
    queryKey: ['gallery-admin'],
    queryFn: () => listGalleryAdmin({ page: 1, limit: 40 }),
  });

  const createMut = useMutation({
    mutationFn: (body: CreateGalleryPostBody) => createGalleryPost(body),
    onSuccess: () => {
      toast.success('Publicación creada');
      void qc.invalidateQueries({ queryKey: ['gallery-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setCreateOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => publishGalleryPost(id),
    onSuccess: () => {
      toast.success('Publicación visible en la galería pública');
      void qc.invalidateQueries({ queryKey: ['gallery-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GalleryForm>({
    defaultValues: { title: '', caption: '', type: 'general' },
  });

  const onCreate = handleSubmit((data) => {
    createMut.mutate({
      title:   data.title.trim(),
      caption: data.caption.trim() || null,
      type:    data.type,
      media:   [],
    });
  });

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Galería</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2"
        >
          <MaterialIcon name="add_photo_alternate" size={18} /> Nueva publicación
        </button>
      </div>

      <div className="grid gap-stack-sm sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((post) => {
          const img = firstMediaUrl(post) ?? (typeof post.image_url === 'string' ? post.image_url : null);
          return (
            <div key={String(post.id)} className="bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl overflow-hidden hover:border-primary/30 transition-colors group">
              <div className="aspect-video bg-surface-container-high flex items-center justify-center">
                {img ? (
                  <img src={img} alt={String(post.title)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <MaterialIcon name="image" className="text-on-surface-variant/30" size={48} />
                )}
              </div>
              <div className="p-4 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-on-surface truncate">{String(post.title)}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-on-surface-variant">{String(post.type ?? 'general')}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-label-caps ${
                      post.is_published ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
                    }`}>
                      {post.is_published ? 'Live' : 'Draft'}
                    </span>
                  </div>
                </div>
                {!post.is_published && (
                  <button
                    type="button"
                    onClick={() => publishMut.mutate(String(post.id))}
                    disabled={publishMut.isPending}
                    className="shrink-0 text-primary font-label-caps text-[10px] hover:underline disabled:opacity-50"
                  >
                    Publicar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DashboardModal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva entrada de galería">
        <form onSubmit={onCreate} className="space-y-3">
          <p className="text-sm text-on-surface-variant">Crea el post sin archivos; luego podrás asociar imágenes desde Supabase o ampliar el panel con subida de archivos.</p>
          <div>
            <label className={formLabelClass}>Título</label>
            <input className={formInputClass} {...register('title', { required: true, minLength: 3 })} />
            {errors.title && <p className={formErrorClass}>{errors.title.message}</p>}
          </div>
          <div>
            <label className={formLabelClass}>Tipo</label>
            <select className={formInputClass} {...register('type')}>
              <option value="general">General</option>
              <option value="match_day">Match day</option>
              <option value="result">Resultado</option>
              <option value="featured_player">Jugador destacado</option>
              <option value="training">Entrenamiento</option>
              <option value="convocatory">Convocatoria</option>
              <option value="achievement">Logro</option>
            </select>
          </div>
          <div>
            <label className={formLabelClass}>Pie de foto / descripción (opcional)</label>
            <textarea rows={3} className={formInputClass} {...register('caption')} />
          </div>
          <div className={formActionsClass}>
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-caps text-label-caps">
              Cancelar
            </button>
            <button type="submit" disabled={createMut.isPending} className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps disabled:opacity-50">
              {createMut.isPending ? 'Guardando…' : 'Crear borrador'}
            </button>
          </div>
        </form>
      </DashboardModal>
    </div>
  );
}
