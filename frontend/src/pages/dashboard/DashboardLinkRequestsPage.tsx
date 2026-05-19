import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  approveLinkRequest,
  listLinkRequests,
  rejectLinkRequest,
  type ParentLinkRequest,
} from '@/api/parents';
import { DashboardModal } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

const STATUS_TABS = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'all', label: 'Todas' },
] as const;

export function DashboardLinkRequestsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>('pending');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const q = useQuery({
    queryKey: ['link-requests', status],
    queryFn: () => listLinkRequests({ status, page: 1, limit: 50 }),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveLinkRequest(id),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Aprobado');
      void qc.invalidateQueries({ queryKey: ['link-requests'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rejectLinkRequest(id, reason),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Rechazado');
      setRejectId(null);
      setRejectReason('');
      void qc.invalidateQueries({ queryKey: ['link-requests'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <Spinner />;

  const rows = (q.data?.data ?? []) as ParentLinkRequest[];

  return (
    <div>
      <div className="mb-stack-md">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Vínculos padre–jugador</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Los padres solicitan vínculo con la CURP del jugador. Aprueba solo si el parentesco es correcto.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-stack-md">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-label-caps border transition-colors ${
              status === tab.value
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:border-primary/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-stack-lg bg-surface-container/30 rounded-xl border border-outline-variant/20">
          <MaterialIcon name="link_off" size={48} className="text-on-surface-variant mx-auto mb-3" />
          <p className="text-on-surface-variant">No hay solicitudes en esta categoría.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container-low/50">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-container border-b border-outline-variant/20">
              <tr>
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Padre / tutor</th>
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Jugador</th>
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Parentesco</th>
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Estado</th>
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-outline-variant/10 hover:bg-surface-container/30 transition-colors"
                >
                  <td className="p-4 text-on-surface font-medium">
                    {r.parent?.firstName} {r.parent?.lastName}
                  </td>
                  <td className="p-4 text-on-surface">
                    {r.player?.firstName} {r.player?.lastName}
                    {r.player?.category ? (
                      <span className="block text-xs text-on-surface-variant">{r.player.category}</span>
                    ) : null}
                  </td>
                  <td className="p-4 capitalize text-on-surface-variant">{r.relationship}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-label-caps ${
                        r.status === 'pending'
                          ? 'bg-amber-500/15 text-amber-400'
                          : r.status === 'approved'
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-error/15 text-error'
                      }`}
                    >
                      {r.status === 'pending' ? 'Pendiente' : r.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </span>
                  </td>
                  <td className="p-4">
                    {r.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => approve.mutate(r.id)}
                          disabled={approve.isPending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-label-caps bg-primary/15 text-primary hover:bg-primary hover:text-on-primary transition-colors"
                        >
                          <MaterialIcon name="check" size={14} /> Aprobar
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectId(r.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-label-caps bg-error/15 text-error hover:bg-error hover:text-white transition-colors"
                        >
                          <MaterialIcon name="close" size={14} /> Rechazar
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-on-surface-variant">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DashboardModal
        open={rejectId !== null}
        onClose={() => {
          setRejectId(null);
          setRejectReason('');
        }}
        title="Rechazar solicitud"
      >
        <p className="text-sm text-on-surface-variant mb-4">
          Opcional: indica un motivo para que el padre lo vea en su panel.
        </p>
        <textarea
          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface min-h-[100px] mb-4"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Ej. El parentesco no coincide con nuestros registros"
        />
        <button
          type="button"
          disabled={reject.isPending}
          onClick={() => {
            if (rejectId) reject.mutate({ id: rejectId, reason: rejectReason.trim() || undefined });
          }}
          className="w-full bg-error text-white font-label-caps py-3 rounded-lg disabled:opacity-60"
        >
          Confirmar rechazo
        </button>
      </DashboardModal>
    </div>
  );
}
