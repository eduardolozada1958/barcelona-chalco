import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  createNotice,
  deleteNotice,
  listNoticesAdmin,
  publishNotice,
  updateNotice,
  type CreateNoticeBody,
} from '@/api/notices';
import { DashboardRowActions } from '@/components/DashboardRowActions';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';
import { noticeTypeLabel } from '@/config/labels';

type NoticeForm = {
  title: string;
  content: string;
  type: NonNullable<CreateNoticeBody['type']>;
  audience: NonNullable<CreateNoticeBody['audience']>;
  isPinned: boolean;
};

export function DashboardNoticesPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (searchParams.get('crear') === '1') {
      setCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('crear');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const q = useQuery({
    queryKey: ['notices-admin'],
    queryFn: () => listNoticesAdmin({ page: 1, limit: 40 }),
  });

  const createMut = useMutation({
    mutationFn: (body: CreateNoticeBody) => createNotice(body),
    onSuccess: () => {
      toast.success('Aviso creado (borrador)');
      void qc.invalidateQueries({ queryKey: ['notices-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setCreateOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateNotice>[1] }) =>
      updateNotice(id, body),
    onSuccess: () => {
      toast.success('Aviso actualizado');
      void qc.invalidateQueries({ queryKey: ['notices-admin'] });
      setEditRow(null);
      resetEdit();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => publishNotice(id),
    onSuccess: () => {
      toast.success('Aviso publicado');
      void qc.invalidateQueries({ queryKey: ['notices-admin'] });
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NoticeForm>({
    defaultValues: {
      title: '',
      content: '',
      type: 'general',
      audience: 'all',
      isPinned: false,
    },
  });

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
    },
  });

  function openEdit(n: Record<string, unknown>) {
    setEditRow(n);
    resetEdit({
      title: String(n.title ?? ''),
      content: String(n.content ?? ''),
      type: (n.type as NoticeForm['type']) ?? 'general',
      audience: (n.audience as NoticeForm['audience']) ?? 'all',
      isPinned: Boolean(n.is_pinned),
    });
  }

  function closeEditModal() {
    setEditRow(null);
    resetEdit();
  }

  function confirmDelete(id: string, title: string) {
    if (!window.confirm(`¿Eliminar el aviso «${title}»? Esta acción no se puede deshacer.`)) return;
    deleteMut.mutate(id);
  }

  const onCreate = handleSubmit((data) => {
    createMut.mutate({
      title:   data.title.trim(),
      content: data.content.trim(),
      type:    data.type,
      audience: data.audience,
      isPinned: data.isPinned,
    });
  });

  const onEdit = handleSubmitEdit((data) => {
    if (!editRow) return;
    updateMut.mutate({
      id: String(editRow.id),
      body: {
        title:   data.title.trim(),
        content: data.content.trim(),
        type:    data.type,
        audience: data.audience,
        isPinned: data.isPinned,
      },
    });
  });

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">📢 Avisos</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2"
        >
          ➕ Crear aviso
        </button>
      </div>

      <div className="grid gap-stack-sm">
        {rows.map((n) => (
          <div key={String(n.id)} className="bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/10 shrink-0">
                <MaterialIcon name="campaign" className="text-primary" size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-on-surface">{String(n.title)}</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">{noticeTypeLabel(String(n.type))}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-label-caps ${
                n.is_published ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
              }`}>
                <MaterialIcon name={n.is_published ? 'public' : 'drafts'} size={12} />
                {n.is_published ? 'Publicado' : 'Borrador'}
              </span>
              <DashboardRowActions
                onEdit={() => openEdit(n)}
                onDelete={() => confirmDelete(String(n.id), String(n.title))}
                onPublish={() => publishMut.mutate(String(n.id))}
                showPublish={!n.is_published}
                isPublished={Boolean(n.is_published)}
                publishPending={publishMut.isPending}
                deletePending={deleteMut.isPending}
              />
            </div>
          </div>
        ))}
      </div>

      <DashboardModal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo aviso" wide>
        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <label className={formLabelClass}>Título</label>
            <input className={formInputClass} {...register('title', { required: 'Requerido', minLength: 3 })} />
            {errors.title && <p className={formErrorClass}>{errors.title.message}</p>}
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
            <textarea rows={8} className={formInputClass} {...register('content', { required: 'Requerido', minLength: 10 })} />
            {errors.content && <p className={formErrorClass}>{errors.content.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pinned-create" className="rounded border-outline-variant" {...register('isPinned')} />
            <label htmlFor="pinned-create" className="text-sm text-on-surface">Fijar en la parte superior</label>
          </div>
          <p className="text-xs text-on-surface-variant">Se crea como borrador. Usa &quot;Publicar&quot; en la lista para hacerlo visible en el sitio público.</p>
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

      <DashboardModal open={Boolean(editRow)} onClose={closeEditModal} title="Editar aviso" wide>
        <form onSubmit={onEdit} className="space-y-3">
          <div>
            <label className={formLabelClass}>Título</label>
            <input className={formInputClass} {...registerEdit('title', { required: 'Requerido', minLength: 3 })} />
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
            <textarea rows={8} className={formInputClass} {...registerEdit('content', { required: 'Requerido', minLength: 10 })} />
            {editErrors.content && <p className={formErrorClass}>{editErrors.content.message}</p>}
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
