import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { approveInscription, convertInscription, listInscriptions, rejectInscription } from '@/api/inscriptions';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

export function DashboardInscriptionsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['inscriptions-admin'],
    queryFn: () => listInscriptions({ page: 1, limit: 40 }),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveInscription(id),
    onSuccess: () => {
      toast.success('Aprobada');
      void qc.invalidateQueries({ queryKey: ['inscriptions-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: (id: string) => {
      const reason = window.prompt('Motivo del rechazo (obligatorio):');
      if (!reason || reason.length < 3) throw new Error('Motivo inválido');
      return rejectInscription(id, { rejectionReason: reason });
    },
    onSuccess: () => {
      toast.success('Rechazada');
      void qc.invalidateQueries({ queryKey: ['inscriptions-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const convert = useMutation({
    mutationFn: (id: string) => convertInscription(id),
    onSuccess: (res) => {
      toast.success(`Jugador creado: ${res.data?.playerId ?? ''}`);
      void qc.invalidateQueries({ queryKey: ['inscriptions-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <Spinner />;
  const rows = (q.data?.data ?? []) as Record<string, unknown>[];

  const statusConfig: Record<string, { icon: string; bg: string; text: string }> = {
    pending:      { icon: 'hourglass_top',  bg: 'bg-primary/15',         text: 'text-primary' },
    under_review: { icon: 'visibility',     bg: 'bg-secondary/15',       text: 'text-secondary' },
    approved:     { icon: 'check_circle',   bg: 'bg-primary/15',         text: 'text-primary' },
    rejected:     { icon: 'cancel',         bg: 'bg-error/15',           text: 'text-error' },
    converted:    { icon: 'person_add',     bg: 'bg-primary/15',         text: 'text-primary' },
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Inscripciones</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {rows.length} solicitudes · Aprueba, rechaza o convierte en jugador
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-low/50">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-container border-b border-outline-variant/20">
            <tr>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Padre / Tutor</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Jugador</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Estado</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const status = String(r.status);
              const cfg = statusConfig[status] ?? statusConfig.pending;
              const isPending = status === 'pending' || status === 'under_review';
              const canConvert = status === 'approved' && !r.converted_player_id;

              return (
                <tr key={String(r.id)} className="border-t border-outline-variant/10 hover:bg-surface-container/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/20">
                        <MaterialIcon name="family_restroom" className="text-on-surface-variant" size={18} />
                      </div>
                      <div>
                        <span className="text-on-surface font-medium">{String(r.parent_first_name)} {String(r.parent_last_name)}</span>
                        <p className="text-[11px] text-on-surface-variant">{String(r.parent_email ?? '')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-on-surface">{String(r.player_first_name)} {String(r.player_last_name)}</span>
                    <p className="text-[11px] text-on-surface-variant">{String(r.player_category ?? '')} · {String(r.player_position ?? '')}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps ${cfg.bg} ${cfg.text}`}>
                      <MaterialIcon name={cfg.icon} size={12} />
                      {status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => approve.mutate(String(r.id))}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-label-caps bg-primary/15 text-primary hover:bg-primary hover:text-on-primary transition-colors"
                          >
                            <MaterialIcon name="check" size={14} /> Aprobar
                          </button>
                          <button
                            type="button"
                            onClick={() => reject.mutate(String(r.id))}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-label-caps bg-error/15 text-error hover:bg-error hover:text-on-error transition-colors"
                          >
                            <MaterialIcon name="close" size={14} /> Rechazar
                          </button>
                        </>
                      )}
                      {canConvert && (
                        <button
                          type="button"
                          onClick={() => convert.mutate(String(r.id))}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-label-caps bg-primary text-on-primary hover:shadow-[0_0_10px_rgba(212,175,55,0.3)] transition-all"
                        >
                          <MaterialIcon name="person_add" size={14} /> Convertir
                        </button>
                      )}
                      {!isPending && !canConvert && (
                        <span className="text-[11px] text-on-surface-variant/50 font-label-caps">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
