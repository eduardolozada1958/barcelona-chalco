import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  createResult,
  deleteResult,
  listResultsAdmin,
  publishResult,
  updateResult,
  type CreateResultBody,
} from '@/api/results';
import { listMatchesAdmin } from '@/api/matches';
import { DashboardRowActions } from '@/components/DashboardRowActions';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

type ResultForm = {
  matchId: string;
  goalsScored: string;
  goalsConceded: string;
  matchReport: string;
};

type ResultEditForm = {
  goalsScored: string;
  goalsConceded: string;
  matchReport: string;
};

function toDatetimeLocalValue(iso: string | unknown): string {
  if (typeof iso !== 'string' || !iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DashboardResultsPage() {
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
    queryKey: ['results-admin'],
    queryFn: () => listResultsAdmin({ page: 1, limit: 200 }),
  });

  const mq = useQuery({
    queryKey: ['matches-admin'],
    queryFn: () => listMatchesAdmin({ page: 1, limit: 200 }),
  });

  const matchTitleById = useMemo(() => {
    const matchesRows = (mq.data?.data ?? []) as Record<string, unknown>[];
    const map = new Map<string, string>();
    for (const m of matchesRows) {
      map.set(String(m.id), String(m.title));
    }
    return map;
  }, [mq.data]);

  const eligibleMatches = useMemo(() => {
    const resultsRows = (q.data?.data ?? []) as Record<string, unknown>[];
    const used = new Set(resultsRows.map((r) => String(r.match_id)));
    const matchesRows = (mq.data?.data ?? []) as Record<string, unknown>[];
    return matchesRows.filter((m) => !used.has(String(m.id)));
  }, [mq.data, q.data]);

  const createMut = useMutation({
    mutationFn: (body: CreateResultBody) => createResult(body),
    onSuccess: () => {
      toast.success('Resultado registrado');
      void qc.invalidateQueries({ queryKey: ['results-admin'] });
      void qc.invalidateQueries({ queryKey: ['matches-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setCreateOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateResult>[1] }) =>
      updateResult(id, body),
    onSuccess: () => {
      toast.success('Resultado actualizado');
      void qc.invalidateQueries({ queryKey: ['results-admin'] });
      setEditRow(null);
      resetEdit();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => publishResult(id),
    onSuccess: () => {
      toast.success('Resultado publicado');
      void qc.invalidateQueries({ queryKey: ['results-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteResult(id),
    onSuccess: () => {
      toast.success('Resultado eliminado');
      void qc.invalidateQueries({ queryKey: ['results-admin'] });
      void qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResultForm>({
    defaultValues: { matchId: '', goalsScored: '0', goalsConceded: '0', matchReport: '' },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<ResultEditForm>({
    defaultValues: { goalsScored: '0', goalsConceded: '0', matchReport: '' },
  });

  function openEdit(r: Record<string, unknown>) {
    setEditRow(r);
    resetEdit({
      goalsScored: String(r.goals_scored ?? '0'),
      goalsConceded: String(r.goals_conceded ?? '0'),
      matchReport: typeof r.match_report === 'string' ? r.match_report : '',
    });
  }

  function closeEditModal() {
    setEditRow(null);
    resetEdit();
  }

  function confirmDelete(id: string, label: string) {
    if (!window.confirm(`¿Eliminar el resultado de «${label}»? Esta acción no se puede deshacer.`)) return;
    deleteMut.mutate(id);
  }

  const onCreate = handleSubmit((data) => {
    if (!data.matchId) {
      toast.error('Selecciona un partido');
      return;
    }
    createMut.mutate({
      matchId:       data.matchId,
      goalsScored:   parseInt(data.goalsScored, 10) || 0,
      goalsConceded: parseInt(data.goalsConceded, 10) || 0,
      matchReport:   data.matchReport.trim() || null,
    });
  });

  const onEdit = handleSubmitEdit((data) => {
    if (!editRow) return;
    updateMut.mutate({
      id: String(editRow.id),
      body: {
        goalsScored:   parseInt(data.goalsScored, 10) || 0,
        goalsConceded: parseInt(data.goalsConceded, 10) || 0,
        matchReport:   data.matchReport.trim() || null,
      },
    });
  });

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">🏆 Resultados</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2"
        >
          <MaterialIcon name="add" size={18} /> Registrar
        </button>
      </div>

      <div className="grid gap-stack-sm">
        {rows.map((r) => {
          const matchId = String(r.match_id);
          const matchTitle = matchTitleById.get(matchId) ?? matchId;
          return (
            <div key={String(r.id)} className="bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/10 shrink-0">
                  <MaterialIcon name="sports_score" className="text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-on-surface font-semibold truncate">{matchTitle}</h3>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    Marcador: <span className="text-primary font-stat-value">{String(r.goals_scored)}-{String(r.goals_conceded)}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-label-caps ${
                  r.published ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
                }`}>
                  <MaterialIcon name={r.published ? 'visibility' : 'visibility_off'} size={12} />
                  {r.published ? 'Publicado' : 'Borrador'}
                </span>
                <DashboardRowActions
                  onEdit={() => openEdit(r)}
                  onDelete={() => confirmDelete(String(r.id), matchTitle)}
                  onPublish={() => publishMut.mutate(String(r.id))}
                  showPublish={!r.published}
                  isPublished={Boolean(r.published)}
                  publishPending={publishMut.isPending}
                  deletePending={deleteMut.isPending}
                />
              </div>
            </div>
          );
        })}
      </div>

      <DashboardModal open={createOpen} onClose={() => setCreateOpen(false)} title="Registrar resultado" wide>
        {mq.isLoading ? (
          <Spinner />
        ) : (
          <form onSubmit={onCreate} className="space-y-3">
            <div>
              <label className={formLabelClass}>Partido (sin resultado previo)</label>
              <select className={formInputClass} {...register('matchId', { required: true })}>
                <option value="">— Seleccionar —</option>
                {eligibleMatches.map((m) => (
                  <option key={String(m.id)} value={String(m.id)}>
                    {String(m.title)} · {toDatetimeLocalValue(m.match_date).replace('T', ' ')}
                  </option>
                ))}
              </select>
              {eligibleMatches.length === 0 && (
                <p className="text-on-surface-variant text-sm mt-2">No hay partidos disponibles: todos tienen resultado o aún no hay partidos.</p>
              )}
              {errors.matchId && <p className={formErrorClass}>{errors.matchId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={formLabelClass}>Goles a favor</label>
                <input type="number" min={0} className={formInputClass} {...register('goalsScored')} />
              </div>
              <div>
                <label className={formLabelClass}>Goles en contra</label>
                <input type="number" min={0} className={formInputClass} {...register('goalsConceded')} />
              </div>
            </div>
            <div>
              <label className={formLabelClass}>Crónica (opcional)</label>
              <textarea rows={4} className={formInputClass} {...register('matchReport')} />
            </div>
            <div className={formActionsClass}>
              <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-caps text-label-caps">
                Cancelar
              </button>
              <button type="submit" disabled={createMut.isPending || eligibleMatches.length === 0} className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-label-caps disabled:opacity-50">
                {createMut.isPending ? 'Guardando…' : 'Guardar resultado'}
              </button>
            </div>
          </form>
        )}
      </DashboardModal>

      <DashboardModal open={Boolean(editRow)} onClose={closeEditModal} title="Editar resultado" wide>
        <form onSubmit={onEdit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={formLabelClass}>Goles a favor</label>
              <input type="number" min={0} className={formInputClass} {...registerEdit('goalsScored', { required: true })} />
              {editErrors.goalsScored && <p className={formErrorClass}>{editErrors.goalsScored.message}</p>}
            </div>
            <div>
              <label className={formLabelClass}>Goles en contra</label>
              <input type="number" min={0} className={formInputClass} {...registerEdit('goalsConceded', { required: true })} />
              {editErrors.goalsConceded && <p className={formErrorClass}>{editErrors.goalsConceded.message}</p>}
            </div>
          </div>
          <div>
            <label className={formLabelClass}>Crónica (opcional)</label>
            <textarea rows={4} className={formInputClass} {...registerEdit('matchReport')} />
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
