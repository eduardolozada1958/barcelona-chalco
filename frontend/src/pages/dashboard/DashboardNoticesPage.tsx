import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  archiveNotice,
  createNotice,
  deleteNotice,
  listNoticesAdmin,
  publishNotice,
  scheduleNotice,
  updateNotice,
  uploadNoticeCover,
  type CreateNoticeBody,
} from '@/api/notices';
import { DashboardRowActions } from '@/components/DashboardRowActions';
import { EmojiPickerBar } from '@/components/EmojiPickerBar';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';
import { noticeTypeLabel } from '@/config/labels';
import { clubDatetimeLocalToIso, formatMatchDateClub, formatMatchTimeClub, isoToClubDatetimeLocal } from '@/utils/club-datetime';

type NoticeForm = {
  title: string;
  content: string;
  type: NonNullable<CreateNoticeBody['type']>;
  audience: NonNullable<CreateNoticeBody['audience']>;
  isPinned: boolean;
  scheduledAt: string;
  publishNow: boolean;
};

function insertEmojiAtCursor(
  el: HTMLInputElement | HTMLTextAreaElement | null,
  emoji: string,
  getValues: () => NoticeForm,
  setValue: (name: 'title' | 'content', value: string, opts?: { shouldDirty?: boolean; shouldValidate?: boolean }) => void,
  field: 'title' | 'content',
) {
  const fromForm = String(getValues()[field] ?? '');
  const base = el?.value ?? fromForm;
  const start = el ? (el.selectionStart ?? base.length) : base.length;
  const end = el ? (el.selectionEnd ?? base.length) : base.length;
  const next = base.slice(0, start) + emoji + base.slice(end);
  setValue(field, next, { shouldDirty: true, shouldValidate: true });
  if (el) {
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  }
}

function noticeStatusBadges(n: Record<string, unknown>) {
  const badges: { key: string; label: string; className: string; icon: string }[] = [];
  if (n.is_archived) {
    badges.push({
      key: 'archived',
      label: 'Archivado',
      className: 'bg-surface-variant text-on-surface-variant',
      icon: 'inventory_2',
    });
  } else if (n.scheduled_publish_at && !n.is_published) {
    badges.push({
      key: 'scheduled',
      label: 'Programado',
      className: 'bg-secondary/15 text-secondary',
      icon: 'schedule',
    });
  } else {
    badges.push({
      key: 'pub',
      label: n.is_published ? 'Publicado' : 'Borrador',
      className: n.is_published ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant',
      icon: n.is_published ? 'public' : 'drafts',
    });
  }
  return badges;
}

export function DashboardNoticesPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [createCoverFile, setCreateCoverFile] = useState<File | null>(null);
  const [createCoverPreview, setCreateCoverPreview] = useState<string | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);

  const createTitleRef = useRef<HTMLInputElement | null>(null);
  const createContentRef = useRef<HTMLTextAreaElement | null>(null);
  const editTitleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (searchParams.get('crear') === '1') {
      setCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('crear');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!createCoverFile) {
      setCreateCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(createCoverFile);
    setCreateCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [createCoverFile]);

  const q = useQuery({
    queryKey: ['notices-admin', showArchived],
    queryFn: () =>
      listNoticesAdmin({
        page: 1,
        limit: 40,
        ...(showArchived ? { includeArchived: '1' } : {}),
      }),
  });

  const createMut = useMutation({
    mutationFn: async (vars: {
      body: CreateNoticeBody;
      cover?: File | null;
      publishNow: boolean;
      scheduledIso: string | null;
    }) => {
      const res = await createNotice(vars.body);
      const row = res.data as Record<string, unknown>;
      const id = String(row.id);
      if (vars.cover) await uploadNoticeCover(id, vars.cover);
      if (vars.scheduledIso) {
        await scheduleNotice(id, vars.scheduledIso);
        const future = new Date(vars.scheduledIso).getTime() > Date.now();
        return future ? ('scheduled' as const) : ('published' as const);
      }
      if (vars.publishNow) {
        await publishNotice(id);
        return 'published' as const;
      }
      return 'draft' as const;
    },
    onSuccess: (mode) => {
      toast.success(
        mode === 'scheduled'
          ? 'Aviso programado (WhatsApp al publicarse)'
          : mode === 'published'
            ? 'Aviso publicado'
            : 'Borrador guardado',
      );
      void qc.invalidateQueries({ queryKey: ['notices-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void qc.invalidateQueries({ queryKey: ['notices-public'] });
      void qc.invalidateQueries({ queryKey: ['notices-public-home'] });
      void qc.invalidateQueries({ queryKey: ['notices-public-urgent-popup'] });
      setCreateOpen(false);
      setCreateCoverFile(null);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({
      id,
      body,
      cover,
      scheduledIso,
    }: {
      id: string;
      body: Parameters<typeof updateNotice>[1];
      cover?: File | null;
      scheduledIso?: string | null;
    }) => {
      await updateNotice(id, body);
      if (cover) await uploadNoticeCover(id, cover);
      if (scheduledIso && new Date(scheduledIso).getTime() > Date.now()) {
        await scheduleNotice(id, scheduledIso);
      }
    },
    onSuccess: () => {
      toast.success('Aviso actualizado');
      void qc.invalidateQueries({ queryKey: ['notices-admin'] });
      setEditRow(null);
      setEditCoverFile(null);
      resetEdit();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => publishNotice(id),
    onSuccess: () => {
      toast.success('Aviso publicado (WhatsApp a todos los padres elegibles)');
      void qc.invalidateQueries({ queryKey: ['notices-admin'] });
      void qc.invalidateQueries({ queryKey: ['notices-public'] });
      void qc.invalidateQueries({ queryKey: ['notices-public-home'] });
      void qc.invalidateQueries({ queryKey: ['notices-public-urgent-popup'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMut = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) => archiveNotice(id, archived),
    onSuccess: (_d, v) => {
      toast.success(v.archived ? 'Aviso archivado' : 'Aviso restaurado');
      void qc.invalidateQueries({ queryKey: ['notices-admin'] });
      void qc.invalidateQueries({ queryKey: ['notices-public'] });
      void qc.invalidateQueries({ queryKey: ['notices-public-home'] });
      void qc.invalidateQueries({ queryKey: ['notices-public-urgent-popup'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteNotice(id),
    onSuccess: () => {
      toast.success('Aviso eliminado');
      void qc.invalidateQueries({ queryKey: ['notices-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { register, handleSubmit, reset, setValue, getValues, watch, formState: { errors } } = useForm<NoticeForm>({
    defaultValues: {
      title: '',
      content: '',
      type: 'general',
      audience: 'all',
      isPinned: false,
      scheduledAt: '',
      publishNow: false,
    },
  });

  const publishNowCreate = watch('publishNow');
  const scheduledAtCreate = watch('scheduledAt');

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<NoticeForm>({
    defaultValues: {
      title: '',
      content: '',
      type: 'general',
      audience: 'all',
      isPinned: false,
      scheduledAt: '',
      publishNow: false,
    },
  });

  function openEdit(n: Record<string, unknown>) {
    setEditRow(n);
    setEditCoverFile(null);
    resetEdit({
      title: String(n.title ?? ''),
      content: String(n.content ?? ''),
      type: (n.type as NoticeForm['type']) ?? 'general',
      audience: (n.audience as NoticeForm['audience']) ?? 'all',
      isPinned: Boolean(n.is_pinned),
      scheduledAt: isoToClubDatetimeLocal(n.scheduled_publish_at ?? ''),
      publishNow: false,
    });
  }

  function closeEditModal() {
    setEditRow(null);
    setEditCoverFile(null);
    resetEdit();
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setCreateCoverFile(null);
    reset();
  }

  function confirmDelete(id: string, title: string) {
    if (!window.confirm(`¿Eliminar el aviso «${title}»? Esta acción no se puede deshacer.`)) return;
    deleteMut.mutate(id);
  }

  const onCreate = handleSubmit((data) => {
    let scheduledIso: string | null = null;
    if (data.scheduledAt.trim()) {
      try {
        scheduledIso = clubDatetimeLocalToIso(data.scheduledAt.trim());
      } catch {
        toast.error('Fecha u hora de publicación inválida');
        return;
      }
    }
    if (scheduledIso && new Date(scheduledIso).getTime() > Date.now() && data.publishNow) {
      toast.error('Si programas fecha, desmarca «Publicar ahora»');
      return;
    }
    createMut.mutate({
      body: {
        title: data.title.trim(),
        content: data.content.trim(),
        type: data.type,
        audience: data.audience,
        isPinned: data.isPinned,
        scheduledPublishAt: scheduledIso,
      },
      cover: createCoverFile,
      publishNow: data.publishNow,
      scheduledIso,
    });
  });

  const onEdit = handleSubmitEdit((data) => {
    if (!editRow) return;
    let scheduledIso: string | null | undefined;
    if (data.scheduledAt.trim()) {
      try {
        scheduledIso = clubDatetimeLocalToIso(data.scheduledAt.trim());
      } catch {
        toast.error('Fecha u hora de publicación inválida');
        return;
      }
    } else {
      scheduledIso = null;
    }
    updateMut.mutate({
      id: String(editRow.id),
      body: {
        title: data.title.trim(),
        content: data.content.trim(),
        type: data.type,
        audience: data.audience,
        isPinned: data.isPinned,
        scheduledPublishAt: scheduledIso ?? null,
      },
      cover: editCoverFile,
      scheduledIso: scheduledIso ?? undefined,
    });
  });

  const regCreateTitle = register('title', { required: 'Requerido', minLength: 3 });
  const regCreateContent = register('content', { required: 'Requerido', minLength: 10 });
  const regEditTitle = registerEdit('title', { required: 'Requerido', minLength: 3 });
  const regEditContent = registerEdit('content', { required: 'Requerido', minLength: 10 });

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">📢 Avisos</h1>
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
            ➕ Crear aviso
          </button>
        </div>
      </div>

      <div className="grid gap-stack-sm">
        {rows.map((n) => {
          const badges = noticeStatusBadges(n);
          const scheduled = n.scheduled_publish_at as string | undefined;
          return (
            <div
              key={String(n.id)}
              className="bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between hover:border-primary/30 transition-colors min-w-0"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/10 shrink-0">
                  <MaterialIcon name="campaign" className="text-primary" size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-on-surface">{String(n.title)}</h3>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    {noticeTypeLabel(String(n.type))}
                    {scheduled && !n.is_published ? (
                      <>
                        {' '}
                        · {formatMatchDateClub(scheduled)} {formatMatchTimeClub(scheduled)}
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full lg:w-auto min-w-0 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  {badges.map((b) => (
                    <span
                      key={b.key}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-label-caps ${b.className}`}
                    >
                      <MaterialIcon name={b.icon} size={12} />
                      {b.label}
                    </span>
                  ))}
                </div>
                <DashboardRowActions
                  layout="grid"
                  onEdit={() => openEdit(n)}
                  onDelete={() => confirmDelete(String(n.id), String(n.title))}
                  onPublish={() => publishMut.mutate(String(n.id))}
                  onArchive={() =>
                    archiveMut.mutate({
                      id: String(n.id),
                      archived: !n.is_archived,
                    })
                  }
                  showPublish={!n.is_published && !n.is_archived}
                  isPublished={Boolean(n.is_published)}
                  isArchived={Boolean(n.is_archived)}
                  publishPending={publishMut.isPending}
                  deletePending={deleteMut.isPending}
                  archivePending={archiveMut.isPending}
                />
              </div>
            </div>
          );
        })}
      </div>

      <DashboardModal open={createOpen} onClose={closeCreateModal} title="Nuevo aviso" wide>
        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <label className={formLabelClass}>Título</label>
            <input
              className={formInputClass}
              {...regCreateTitle}
              ref={(e) => {
                regCreateTitle.ref(e);
                createTitleRef.current = e;
              }}
            />
            {errors.title && <p className={formErrorClass}>{errors.title.message}</p>}
            <EmojiPickerBar
              label="Emojis para el título"
              onPick={(emoji) => insertEmojiAtCursor(createTitleRef.current, emoji, getValues, setValue, 'title')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={formLabelClass}>Tipo</label>
              <select className={formInputClass} {...register('type')}>
                <option value="general">General</option>
                <option value="urgent">Urgente</option>
                <option value="event">Evento</option>
                <option value="training">Entrenamiento</option>
                <option value="match">Partido</option>
                <option value="administrative">Administrativo</option>
              </select>
            </div>
            <div>
              <label className={formLabelClass}>Audiencia</label>
              <select className={formInputClass} {...register('audience')}>
                <option value="all">Todos</option>
                <option value="parents">Padres</option>
                <option value="players">Jugadores</option>
                <option value="coaches">Entrenadores</option>
              </select>
            </div>
          </div>
          <div>
            <label className={formLabelClass}>Contenido</label>
            <textarea
              rows={8}
              className={formInputClass}
              {...regCreateContent}
              ref={(e) => {
                regCreateContent.ref(e);
                createContentRef.current = e;
              }}
            />
            {errors.content && <p className={formErrorClass}>{errors.content.message}</p>}
            <EmojiPickerBar
              label="Emojis para el contenido"
              onPick={(emoji) => insertEmojiAtCursor(createContentRef.current, emoji, getValues, setValue, 'content')}
            />
          </div>
          <div>
            <label className={formLabelClass}>Imagen del aviso (opcional)</label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => setCreateCoverFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-outline-variant/50 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
            >
              <MaterialIcon name="photo_library" size={20} />
              {createCoverFile ? createCoverFile.name : 'Elegir desde tu galería o archivos'}
            </button>
            {createCoverPreview ? (
              <img src={createCoverPreview} alt="" className="mt-2 max-h-32 rounded-lg object-cover" />
            ) : null}
            <p className="text-[11px] text-on-surface-variant mt-1">
              Para avisos <strong>Urgente</strong>, esta imagen se muestra en popup al entrar al sitio.
            </p>
          </div>
          <div>
            <label className={formLabelClass}>Publicar programado (opcional)</label>
            <input type="datetime-local" className={formInputClass} {...register('scheduledAt')} />
            <p className="text-[11px] text-on-surface-variant mt-1">
              Hora del club (México). Al llegar la fecha se publica en el sitio y se envía WhatsApp a todos los padres
              elegibles.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pinned-create" className="rounded border-outline-variant" {...register('isPinned')} />
              <label htmlFor="pinned-create" className="text-sm text-on-surface">Fijar en la parte superior</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="publish-now-create"
                className="rounded border-outline-variant"
                {...register('publishNow')}
                disabled={Boolean(scheduledAtCreate?.trim())}
              />
              <label htmlFor="publish-now-create" className="text-sm text-on-surface">
                Publicar ahora (WhatsApp a todos)
              </label>
            </div>
          </div>
          {!scheduledAtCreate?.trim() && !publishNowCreate ? (
            <p className="text-xs text-on-surface-variant">Si no programas ni publicas ahora, queda como borrador.</p>
          ) : null}
          <div className={formActionsClass}>
            <button
              type="button"
              onClick={closeCreateModal}
              className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-caps text-label-caps"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps disabled:opacity-50"
            >
              {createMut.isPending ? 'Guardando…' : scheduledAtCreate?.trim() ? 'Programar' : publishNowCreate ? 'Publicar' : 'Guardar borrador'}
            </button>
          </div>
        </form>
      </DashboardModal>

      <DashboardModal open={Boolean(editRow)} onClose={closeEditModal} title="Editar aviso" wide>
        <form onSubmit={onEdit} className="space-y-3">
          <div>
            <label className={formLabelClass}>Título</label>
            <input
              className={formInputClass}
              {...regEditTitle}
              ref={(e) => {
                regEditTitle.ref(e);
                editTitleRef.current = e;
              }}
            />
            {editErrors.title && <p className={formErrorClass}>{editErrors.title.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={formLabelClass}>Tipo</label>
              <select className={formInputClass} {...registerEdit('type')}>
                <option value="general">General</option>
                <option value="urgent">Urgente</option>
                <option value="event">Evento</option>
                <option value="training">Entrenamiento</option>
                <option value="match">Partido</option>
                <option value="administrative">Administrativo</option>
              </select>
            </div>
            <div>
              <label className={formLabelClass}>Audiencia</label>
              <select className={formInputClass} {...registerEdit('audience')}>
                <option value="all">Todos</option>
                <option value="parents">Padres</option>
                <option value="players">Jugadores</option>
                <option value="coaches">Entrenadores</option>
              </select>
            </div>
          </div>
          <div>
            <label className={formLabelClass}>Contenido</label>
            <textarea rows={8} className={formInputClass} {...regEditContent} />
          </div>
          <div>
            <label className={formLabelClass}>Cambiar imagen</label>
            <input
              ref={editCoverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => setEditCoverFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => editCoverInputRef.current?.click()}
              className="text-sm text-primary underline"
            >
              {editCoverFile ? editCoverFile.name : 'Subir nueva imagen'}
            </button>
            {editRow?.cover_image_url ? (
              <img
                src={String(editRow.cover_image_url)}
                alt=""
                className="mt-2 max-h-24 rounded-lg object-cover"
              />
            ) : null}
          </div>
          <div>
            <label className={formLabelClass}>Programar publicación</label>
            <input type="datetime-local" className={formInputClass} {...registerEdit('scheduledAt')} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pinned-edit" className="rounded border-outline-variant" {...registerEdit('isPinned')} />
            <label htmlFor="pinned-edit" className="text-sm text-on-surface">Fijar en la parte superior</label>
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
