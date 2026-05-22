import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  addGalleryPostMedia,
  archiveGalleryPost,
  createGalleryPostWithMedia,
  deleteGalleryPost,
  listGalleryAdmin,
  publishGalleryPost,
  removeGalleryPostMedia,
  updateGalleryPost,
  type CreateGalleryPostBody,
} from '@/api/gallery';
import { clubDatetimeLocalToIso, formatMatchDateClub, formatMatchTimeClub, isoToClubDatetimeLocal } from '@/utils/club-datetime';
import { DashboardRowActions } from '@/components/DashboardRowActions';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';
import { GALLERY_TYPE_OPTIONS, galleryTypeLabel } from '@/config/gallery';

type GalleryForm = {
  title: string;
  caption: string;
  type: NonNullable<CreateGalleryPostBody['type']>;
  publish: boolean;
  scheduledAt: string;
};

type GalleryEditForm = {
  title: string;
  caption: string;
  type: NonNullable<CreateGalleryPostBody['type']>;
  scheduledAt: string;
};

const MAX_IMAGES = 20;

function firstMediaUrl(post: Record<string, unknown>): string | null {
  const media = post.gallery_media;
  if (!Array.isArray(media) || media.length === 0) return null;
  const sorted = [...media]
    .map((item) => {
      const o = item as Record<string, unknown>;
      const sort = typeof o.sort_order === 'number' ? o.sort_order : 0;
      const url = typeof o.url === 'string' ? o.url : null;
      return url ? { sort, url } : null;
    })
    .filter((x): x is { sort: number; url: string } => x != null)
    .sort((a, b) => a.sort - b.sort);
  return sorted[0]?.url ?? null;
}

/** Filas de `gallery_media` ordenadas por `sort_order`. */
function galleryMediaFromPost(post: Record<string, unknown> | null): { id: string; url: string }[] {
  if (!post) return [];
  const media = post.gallery_media;
  if (!Array.isArray(media)) return [];
  const rows = media
    .map((item) => {
      const o = item as Record<string, unknown>;
      const id = o.id != null ? String(o.id) : '';
      const url = typeof o.url === 'string' ? o.url : '';
      const sort = typeof o.sort_order === 'number' ? o.sort_order : 0;
      if (!id || !url) return null;
      return { id, url, sort };
    })
    .filter((x): x is { id: string; url: string; sort: number } => x != null)
    .sort((a, b) => a.sort - b.sort);
  return rows.map(({ id, url }) => ({ id, url }));
}

export function DashboardGalleryPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get('crear') === '1') {
      setCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('crear');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [imageFiles]);

  const q = useQuery({
    queryKey: ['gallery-admin', showArchived],
    queryFn: () =>
      listGalleryAdmin({
        page: 1,
        limit: 40,
        ...(showArchived ? { includeArchived: '1' } : {}),
      }),
  });

  const createMut = useMutation({
    mutationFn: createGalleryPostWithMedia,
    onSuccess: (_data, vars) => {
      toast.success(vars.publish ? 'Publicación publicada' : 'Publicación creada');
      void qc.invalidateQueries({ queryKey: ['gallery-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void qc.invalidateQueries({ queryKey: ['gallery-public'] });
      closeCreateModal();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => publishGalleryPost(id),
    onSuccess: () => {
      toast.success('Publicada (WhatsApp a todos los padres elegibles)');
      void qc.invalidateQueries({ queryKey: ['gallery-admin'] });
      void qc.invalidateQueries({ queryKey: ['gallery-public'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMut = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) => archiveGalleryPost(id, archived),
    onSuccess: (_d, v) => {
      toast.success(v.archived ? 'Publicación archivada' : 'Publicación restaurada');
      void qc.invalidateQueries({ queryKey: ['gallery-admin'] });
      void qc.invalidateQueries({ queryKey: ['gallery-public'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateGalleryPost>[1] }) =>
      updateGalleryPost(id, body),
    onSuccess: () => {
      toast.success('Publicación actualizada');
      void qc.invalidateQueries({ queryKey: ['gallery-admin'] });
      void qc.invalidateQueries({ queryKey: ['gallery-public'] });
      setEditRow(null);
      resetEdit();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteGalleryPost(id),
    onSuccess: () => {
      toast.success('Publicación eliminada');
      void qc.invalidateQueries({ queryKey: ['gallery-admin'] });
      void qc.invalidateQueries({ queryKey: ['gallery-public'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addMediaMut = useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) => addGalleryPostMedia(id, files),
    onSuccess: (res, _vars) => {
      const row = res.data as Record<string, unknown> | undefined;
      if (row) setEditRow(row);
      toast.success(res.message || 'Imágenes añadidas');
      void qc.invalidateQueries({ queryKey: ['gallery-admin'] });
      void qc.invalidateQueries({ queryKey: ['gallery-public'] });
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMediaMut = useMutation({
    mutationFn: ({ id, mediaId }: { id: string; mediaId: string }) => removeGalleryPostMedia(id, mediaId),
    onSuccess: (res) => {
      const row = res.data as Record<string, unknown> | undefined;
      if (row) setEditRow(row);
      toast.success(res.message || 'Imagen eliminada');
      void qc.invalidateQueries({ queryKey: ['gallery-admin'] });
      void qc.invalidateQueries({ queryKey: ['gallery-public'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<GalleryForm>({
    defaultValues: { title: '', caption: '', type: 'general', publish: false, scheduledAt: '' },
  });

  const scheduledAtCreate = watch('scheduledAt');
  const publishNowCreate = watch('publish');

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<GalleryEditForm>({
    defaultValues: { title: '', caption: '', type: 'general', scheduledAt: '' },
  });

  function openEdit(post: Record<string, unknown>) {
    setEditRow(post);
    resetEdit({
      title: String(post.title ?? ''),
      caption: typeof post.caption === 'string' ? post.caption : '',
      type: (post.type as GalleryEditForm['type']) ?? 'general',
      scheduledAt: isoToClubDatetimeLocal(post.scheduled_publish_at ?? ''),
    });
  }

  function closeEditModal() {
    setEditRow(null);
    resetEdit();
  }

  function confirmDelete(id: string, title: string) {
    if (!window.confirm(`¿Eliminar la publicación «${title}»? Esta acción no se puede deshacer.`)) return;
    deleteMut.mutate(id);
  }

  const onEdit = handleSubmitEdit((data) => {
    if (!editRow) return;
    let scheduledIso: string | null = null;
    if (data.scheduledAt.trim()) {
      try {
        scheduledIso = clubDatetimeLocalToIso(data.scheduledAt.trim());
      } catch {
        toast.error('Fecha u hora de publicación inválida');
        return;
      }
    }
    updateMut.mutate({
      id: String(editRow.id),
      body: {
        title: data.title.trim(),
        caption: data.caption.trim() || null,
        type: data.type,
        scheduledPublishAt: scheduledIso,
      },
    });
  });

  function closeCreateModal() {
    setCreateOpen(false);
    setImageFiles([]);
    reset();
  }

  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;

    const valid = picked.filter((f) => ['image/png', 'image/jpeg', 'image/webp'].includes(f.type));
    if (valid.length < picked.length) {
      toast.error('Solo se permiten imágenes PNG, JPEG o WebP');
    }

    setImageFiles((prev) => {
      const merged = [...prev, ...valid].slice(0, MAX_IMAGES);
      if (merged.length >= MAX_IMAGES) {
        toast.error(`Máximo ${MAX_IMAGES} imágenes por publicación`);
      }
      return merged;
    });
    e.target.value = '';
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function onPickEditImages(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editRow) return;
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!picked.length) return;

    const valid = picked.filter((f) => ['image/png', 'image/jpeg', 'image/webp'].includes(f.type));
    if (valid.length < picked.length) {
      toast.error('Solo se permiten imágenes PNG, JPEG o WebP');
    }
    const currentCount = galleryMediaFromPost(editRow).length;
    const room = MAX_IMAGES - currentCount;
    if (room <= 0) {
      toast.error(`Máximo ${MAX_IMAGES} imágenes por publicación`);
      return;
    }
    const toAdd = valid.slice(0, room);
    if (toAdd.length < valid.length) {
      toast.error(`Solo caben ${room} imagen(es) más`);
    }
    if (!toAdd.length) return;
    addMediaMut.mutate({ id: String(editRow.id), files: toAdd });
  }

  const onCreate = handleSubmit((data) => {
    if (imageFiles.length === 0) {
      toast.error('Adjunta al menos una imagen');
      return;
    }
    let scheduledIso: string | null = null;
    if (data.scheduledAt.trim()) {
      try {
        scheduledIso = clubDatetimeLocalToIso(data.scheduledAt.trim());
      } catch {
        toast.error('Fecha u hora de publicación inválida');
        return;
      }
    }
    if (scheduledIso && new Date(scheduledIso).getTime() > Date.now() && data.publish) {
      toast.error('Si programas fecha, desmarca «Publicar de inmediato»');
      return;
    }
    createMut.mutate({
      title:   data.title.trim(),
      caption: data.caption.trim() || null,
      type:    data.type,
      publish: data.publish,
      scheduledPublishAt: scheduledIso,
      images:  imageFiles,
    });
  });

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];
  const editMediaList = galleryMediaFromPost(editRow);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">📸 Galería</h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-outline-variant"
            />
            Ver archivados
          </label>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2"
          >
            ➕ Nueva publicación
          </button>
        </div>
      </div>

      <div className="grid gap-stack-sm sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((post) => {
          const img = firstMediaUrl(post) ?? (typeof post.image_url === 'string' ? post.image_url : null);
          return (
            <div key={String(post.id)} className="bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl hover:border-primary/30 transition-colors group flex flex-col min-w-0">
              <div className="aspect-video overflow-hidden bg-surface-container-high flex items-center justify-center rounded-t-xl">
                {img ? (
                  <img src={img} alt={String(post.title)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <MaterialIcon name="image" className="text-on-surface-variant/30" size={48} />
                )}
              </div>
              <div className="p-4 flex flex-col gap-3 min-w-0">
                <div className="min-w-0">
                  <h3 className="font-medium text-on-surface line-clamp-2">{String(post.title)}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs text-on-surface-variant">{galleryTypeLabel(String(post.type ?? 'general'))}</span>
                    {post.is_archived ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-label-caps bg-surface-variant text-on-surface-variant">
                        Archivada
                      </span>
                    ) : post.scheduled_publish_at && !post.is_published ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-label-caps bg-secondary/15 text-secondary">
                        Programada
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-label-caps ${
                        post.is_published ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
                      }`}>
                        {post.is_published ? 'Publicada' : 'Borrador'}
                      </span>
                    )}
                  </div>
                  {post.scheduled_publish_at && !post.is_published ? (
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      {formatMatchDateClub(post.scheduled_publish_at)} {formatMatchTimeClub(post.scheduled_publish_at)}
                    </p>
                  ) : null}
                </div>
                <DashboardRowActions
                  layout="grid"
                  onEdit={() => openEdit(post)}
                  onDelete={() => confirmDelete(String(post.id), String(post.title))}
                  onPublish={() => publishMut.mutate(String(post.id))}
                  onArchive={() =>
                    archiveMut.mutate({
                      id: String(post.id),
                      archived: !post.is_archived,
                    })
                  }
                  showPublish={!post.is_published && !post.is_archived}
                  isPublished={Boolean(post.is_published)}
                  isArchived={Boolean(post.is_archived)}
                  publishPending={publishMut.isPending}
                  deletePending={deleteMut.isPending}
                  archivePending={archiveMut.isPending}
                />
              </div>
            </div>
          );
        })}
      </div>

      <DashboardModal open={createOpen} onClose={closeCreateModal} title="Nueva entrada de galería">
        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <label className={formLabelClass}>Fotos</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={onPickImages}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
            >
              <MaterialIcon name="add_photo_alternate" size={20} />
              Seleccionar imágenes (PNG, JPEG o WebP)
            </button>
            <p className="text-xs text-on-surface-variant mt-1">Hasta {MAX_IMAGES} fotos por publicación.</p>
            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {previews.map((src, i) => (
                  <div key={src} className="relative aspect-square rounded-lg overflow-hidden border border-outline-variant/30">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-background/80 text-on-surface rounded-full p-0.5 hover:bg-error/80 hover:text-on-error"
                      aria-label="Quitar imagen"
                    >
                      <MaterialIcon name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={formLabelClass}>Título</label>
            <input className={formInputClass} {...register('title', { required: 'El título es obligatorio', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })} />
            {errors.title && <p className={formErrorClass}>{errors.title.message}</p>}
          </div>

          <div>
            <label className={formLabelClass}>Tipo</label>
            <select className={formInputClass} {...register('type')}>
              {GALLERY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={formLabelClass}>Pie de foto / descripción (opcional)</label>
            <textarea rows={3} className={formInputClass} {...register('caption')} />
          </div>

          <div>
            <label className={formLabelClass}>Publicar programado (opcional)</label>
            <input type="datetime-local" className={formInputClass} {...register('scheduledAt')} />
            <p className="text-[11px] text-on-surface-variant mt-1">
              Hora del club. Al llegar la fecha se publica y envía WhatsApp a todos los padres elegibles.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-on-surface-variant">
            <input
              type="checkbox"
              className="rounded border-outline-variant"
              {...register('publish')}
              disabled={Boolean(scheduledAtCreate?.trim())}
            />
            Publicar de inmediato (WhatsApp a todos)
          </label>

          <div className={formActionsClass}>
            <button type="button" onClick={closeCreateModal} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-caps text-label-caps">
              Cancelar
            </button>
            <button type="submit" disabled={createMut.isPending} className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps disabled:opacity-50">
              {createMut.isPending
                ? 'Subiendo…'
                : scheduledAtCreate?.trim()
                  ? 'Programar'
                  : publishNowCreate
                    ? 'Publicar'
                    : 'Guardar borrador'}
            </button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal open={Boolean(editRow)} onClose={closeEditModal} title="Editar publicación">
        <form onSubmit={onEdit} className="space-y-3">
          {editRow && (
            <div>
              <label className={formLabelClass}>Imágenes</label>
              <p className="text-[11px] text-on-surface-variant mb-2">
                Elimina fotos o añade más (máximo {MAX_IMAGES} en total). Debe quedar al menos una imagen en la publicación.
              </p>
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={onPickEditImages}
              />
              <button
                type="button"
                onClick={() => editFileInputRef.current?.click()}
                disabled={addMediaMut.isPending || editMediaList.length >= MAX_IMAGES}
                className="mb-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <MaterialIcon name="add_photo_alternate" size={20} />
                {addMediaMut.isPending ? 'Subiendo…' : 'Añadir imágenes'}
              </button>
              {editMediaList.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {editMediaList.map((m) => {
                    const onlyOne = editMediaList.length <= 1;
                    return (
                      <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden border border-outline-variant/30">
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          title={onlyOne ? 'Sube otra imagen antes de borrar esta' : 'Eliminar imagen'}
                          disabled={removeMediaMut.isPending || onlyOne}
                          onClick={() => removeMediaMut.mutate({ id: String(editRow.id), mediaId: m.id })}
                          className="absolute top-1 right-1 bg-background/90 text-on-surface rounded-full p-0.5 hover:bg-error/80 hover:text-on-error disabled:opacity-40 disabled:pointer-events-none"
                          aria-label="Eliminar imagen"
                        >
                          <MaterialIcon name="delete" size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <div>
            <label className={formLabelClass}>Título</label>
            <input className={formInputClass} {...registerEdit('title', { required: 'El título es obligatorio', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })} />
            {editErrors.title && <p className={formErrorClass}>{editErrors.title.message}</p>}
          </div>
          <div>
            <label className={formLabelClass}>Tipo</label>
            <select className={formInputClass} {...registerEdit('type')}>
              {GALLERY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={formLabelClass}>Pie de foto / descripción (opcional)</label>
            <textarea rows={3} className={formInputClass} {...registerEdit('caption')} />
          </div>
          <div>
            <label className={formLabelClass}>Programar publicación</label>
            <input type="datetime-local" className={formInputClass} {...registerEdit('scheduledAt')} />
          </div>
          <div className={formActionsClass}>
            <button type="button" onClick={closeEditModal} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-caps text-label-caps">
              Cancelar
            </button>
            <button type="submit" disabled={updateMut.isPending} className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps disabled:opacity-50">
              {updateMut.isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </DashboardModal>
    </div>
  );
}
