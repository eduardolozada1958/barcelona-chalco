import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { createMatch, listMatchesAdmin, type CreateMatchBody } from '@/api/matches';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

type MatchForm = {
  title: string;
  opponentName: string;
  matchDateLocal: string;
  location: string;
  category: string;
  matchType: NonNullable<CreateMatchBody['matchType']>;
  status: NonNullable<CreateMatchBody['status']>;
  isHome: boolean;
  description: string;
};

export function DashboardMatchesPage() {
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
    queryKey: ['matches-admin'],
    queryFn: () => listMatchesAdmin({ page: 1, limit: 40 }),
  });

  const createMut = useMutation({
    mutationFn: (body: CreateMatchBody) => createMatch(body),
    onSuccess: () => {
      toast.success('Partido creado');
      void qc.invalidateQueries({ queryKey: ['matches-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setCreateOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MatchForm>({
    defaultValues: {
      title: '',
      opponentName: '',
      matchDateLocal: '',
      location: '',
      category: 'Sub-17',
      matchType: 'league',
      status: 'scheduled',
      isHome: true,
      description: '',
    },
  });

  const onCreate = handleSubmit((data) => {
    if (!data.matchDateLocal) {
      toast.error('Indica fecha y hora del partido');
      return;
    }
    const matchDate = new Date(data.matchDateLocal).toISOString();
    const body: CreateMatchBody = {
      title:        data.title.trim(),
      opponentName: data.opponentName.trim(),
      matchDate,
      location:     data.location.trim(),
      category:     data.category.trim(),
      matchType:    data.matchType,
      status:       data.status,
      isHome:       data.isHome,
      description:  data.description.trim() || null,
    };
    createMut.mutate(body);
  });

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Partidos</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Gestión de calendario deportivo</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2"
        >
          <MaterialIcon name="add" size={18} /> Programar
        </button>
      </div>

      <div className="grid gap-stack-sm">
        {rows.map((m) => {
          const status = String(m.status);
          return (
            <div key={String(m.id)} className="bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-5 flex items-center justify-between hover:border-primary/30 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/10 group-hover:bg-primary/10 transition-colors">
                  <MaterialIcon name="sports_soccer" className="text-primary" />
                </div>
                <div>
                  <h3 className="font-headline-lg-mobile text-body-lg text-on-surface font-semibold">{String(m.title)}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1"><MaterialIcon name="event" size={14} /> {String(m.match_date).slice(0, 10)}</span>
                    <span className="flex items-center gap-1"><MaterialIcon name="location_on" size={14} /> {String(m.location || '—')}</span>
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-label-caps ${
                status === 'scheduled' ? 'bg-secondary/15 text-secondary' :
                status === 'completed' ? 'bg-primary/15 text-primary' :
                'bg-surface-variant text-on-surface-variant'
              }`}>
                <MaterialIcon name={status === 'completed' ? 'check_circle' : 'schedule'} size={12} />
                {status}
              </span>
            </div>
          );
        })}
      </div>

      <DashboardModal open={createOpen} onClose={() => setCreateOpen(false)} title="Programar partido" wide>
        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <label className={formLabelClass}>Título del partido</label>
            <input className={formInputClass} {...register('title', { required: 'Requerido', minLength: 3 })} placeholder="Ej. Academia vs Tigres" />
            {errors.title && <p className={formErrorClass}>{errors.title.message}</p>}
          </div>
          <div>
            <label className={formLabelClass}>Rival</label>
            <input className={formInputClass} {...register('opponentName', { required: 'Requerido', minLength: 2 })} />
            {errors.opponentName && <p className={formErrorClass}>{errors.opponentName.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={formLabelClass}>Fecha y hora</label>
              <input type="datetime-local" className={formInputClass} {...register('matchDateLocal', { required: true })} />
            </div>
            <div>
              <label className={formLabelClass}>Categoría</label>
              <input className={formInputClass} {...register('category', { required: true })} placeholder="Sub-17" />
            </div>
          </div>
          <div>
            <label className={formLabelClass}>Sede / ubicación</label>
            <input className={formInputClass} {...register('location', { required: 'Requerido', minLength: 2 })} />
            {errors.location && <p className={formErrorClass}>{errors.location.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={formLabelClass}>Tipo</label>
              <select className={formInputClass} {...register('matchType')}>
                <option value="league">Liga</option>
                <option value="cup">Copa</option>
                <option value="friendly">Amistoso</option>
                <option value="tournament">Torneo</option>
                <option value="internal">Interno</option>
              </select>
            </div>
            <div>
              <label className={formLabelClass}>Estado</label>
              <select className={formInputClass} {...register('status')}>
                <option value="scheduled">Programado</option>
                <option value="in_progress">En juego</option>
                <option value="completed">Finalizado</option>
                <option value="cancelled">Cancelado</option>
                <option value="postponed">Aplazado</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isHome" className="rounded border-outline-variant" {...register('isHome')} />
            <label htmlFor="isHome" className="text-sm text-on-surface">Partido en casa</label>
          </div>
          <div>
            <label className={formLabelClass}>Descripción (opcional)</label>
            <textarea rows={2} className={formInputClass} {...register('description')} />
          </div>
          <div className={formActionsClass}>
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-caps text-label-caps">
              Cancelar
            </button>
            <button type="submit" disabled={createMut.isPending} className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps disabled:opacity-50">
              {createMut.isPending ? 'Guardando…' : 'Crear partido'}
            </button>
          </div>
        </form>
      </DashboardModal>
    </div>
  );
}
