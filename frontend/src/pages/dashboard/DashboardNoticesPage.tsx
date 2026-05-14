import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { createNotice, listNoticesAdmin, publishNotice, type CreateNoticeBody } from '@/api/notices';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

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

  const publishMut = useMutation({
    mutationFn: (id: string) => publishNotice(id),
    onSuccess: () => {
      toast.success('Aviso publicado');
      void qc.invalidateQueries({ queryKey: ['notices-admin'] });
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

  const onCreate = handleSubmit((data) => {
    createMut.mutate({
      title:   data.title.trim(),
      content: data.content.trim(),
      type:    data.type,
      audience: data.audience,
      isPinned: data.isPinned,
    });
  });

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Avisos</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2"
        >
          <MaterialIcon name="add" size={18} /> Crear aviso
        </button>
      </div>

      <div className="grid gap-stack-sm">
        {rows.map((n) => (
          <div key={String(n.id)} className="bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/10">
                <MaterialIcon name="campaign" className="text-primary" size={20} />
              </div>
              <div>
                <h3 className="font-medium text-on-surface">{String(n.title)}</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">{String(n.type ?? '—')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-label-caps ${
                n.is_published ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
              }`}>
                <MaterialIcon name={n.is_published ? 'public' : 'drafts'} size={12} />
                {n.is_published ? 'Publicado' : 'Borrador'}
              </span>
              {!n.is_published && (
                <button
                  type="button"
                  onClick={() => publishMut.mutate(String(n.id))}
                  disabled={publishMut.isPending}
                  className="text-primary font-label-caps text-label-caps hover:underline disabled:opacity-50 whitespace-nowrap"
                >
                  Publicar
                </button>
              )}
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
            <input type="checkbox" id="pinned" className="rounded border-outline-variant" {...register('isPinned')} />
            <label htmlFor="pinned" className="text-sm text-on-surface">Fijar en la parte superior</label>
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
    </div>
  );
}
