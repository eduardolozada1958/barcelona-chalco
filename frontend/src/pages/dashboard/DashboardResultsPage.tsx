import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { createResult, listResultsAdmin, type CreateResultBody } from '@/api/results';
import { listMatchesAdmin } from '@/api/matches';
import { DashboardModal, formActionsClass, formErrorClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

type ResultForm = {
  matchId: string;
  goalsScored: string;
  goalsConceded: string;
  matchReport: string;
};

export function DashboardResultsPage() {
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
    queryKey: ['results-admin'],
    queryFn: () => listResultsAdmin({ page: 1, limit: 200 }),
  });

  const mq = useQuery({
    queryKey: ['matches-admin'],
    queryFn: () => listMatchesAdmin({ page: 1, limit: 200 }),
    enabled: createOpen,
  });

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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResultForm>({
    defaultValues: { matchId: '', goalsScored: '0', goalsConceded: '0', matchReport: '' },
  });

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

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Resultados</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-on-primary font-label-caps text-label-caps px-5 py-2.5 rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2"
        >
          <MaterialIcon name="add" size={18} /> Registrar
        </button>
      </div>

      <div className="grid gap-stack-sm">
        {rows.map((r) => (
          <div key={String(r.id)} className="bg-surface-container/40 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/10">
                <MaterialIcon name="sports_score" className="text-primary" />
              </div>
              <div>
                <h3 className="text-on-surface font-semibold">Partido {String(r.match_id)}</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  Marcador: <span className="text-primary font-stat-value">{String(r.goals_scored)}-{String(r.goals_conceded)}</span>
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-label-caps ${
              r.published ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
            }`}>
              <MaterialIcon name={r.published ? 'visibility' : 'visibility_off'} size={12} />
              {r.published ? 'Publicado' : 'Borrador'}
            </span>
          </div>
        ))}
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
                    {String(m.title)} · {String(m.match_date).slice(0, 16).replace('T', ' ')}
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
    </div>
  );
}
