import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  approveLinkRequest,
  listLinkRequests,
  rejectLinkRequest,
  revokeLinkRequest,
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

const actionBtn =
  'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-label-caps border transition-colors touch-manipulation whitespace-nowrap';

function LinkRequestActions({
  row,
  onApprove,
  onReject,
  onRevoke,
  onViewRejectReason,
  approvePending,
  revokePending,
}: {
  row: ParentLinkRequest;
  onApprove: () => void;
  onReject: () => void;
  onRevoke: () => void;
  onViewRejectReason: () => void;
  approvePending: boolean;
  revokePending: boolean;
}) {
  const parentUserId = row.parent?.userId;
  const playerId = row.player?.id ?? row.playerId;

  const navButtons = (
    <>
      {parentUserId ? (
        <Link
          to={`/dashboard/users?userId=${parentUserId}`}
          className={`${actionBtn} text-on-surface-variant border-outline-variant/40 hover:border-primary/40 hover:text-primary`}
        >
          <MaterialIcon name="person" size={14} />
          Ver padre
        </Link>
      ) : null}
      {playerId ? (
        <Link
          to={`/dashboard/players/${playerId}`}
          className={`${actionBtn} text-on-surface-variant border-outline-variant/40 hover:border-primary/40 hover:text-primary`}
        >
          <MaterialIcon name="sports_soccer" size={14} />
          Ver jugador
        </Link>
      ) : null}
    </>
  );

  if (row.status === 'pending') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {navButtons}
        <button
          type="button"
          onClick={onApprove}
          disabled={approvePending}
          className={`${actionBtn} bg-primary/15 text-primary border-primary/30 hover:bg-primary hover:text-on-primary disabled:opacity-50`}
        >
          <MaterialIcon name="check" size={14} />
          Aprobar
        </button>
        <button
          type="button"
          onClick={onReject}
          className={`${actionBtn} bg-error/15 text-error border-error/30 hover:bg-error hover:text-white`}
        >
          <MaterialIcon name="close" size={14} />
          Rechazar
        </button>
      </div>
    );
  }

  if (row.status === 'approved') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {navButtons}
        <button
          type="button"
          disabled={revokePending}
          onClick={onRevoke}
          className={`${actionBtn} bg-error/10 text-error border-error/40 hover:bg-error/20 disabled:opacity-50`}
        >
          <MaterialIcon name="link_off" size={14} />
          Revocar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {navButtons}
      {row.rejectReason ? (
        <button
          type="button"
          onClick={onViewRejectReason}
          className={`${actionBtn} text-on-surface-variant border-outline-variant/40 hover:border-primary/40 hover:text-primary`}
        >
          <MaterialIcon name="info" size={14} />
          Ver motivo
        </button>
      ) : (
        <span className="text-xs text-on-surface-variant">Sin motivo</span>
      )}
    </div>
  );
}

export function DashboardLinkRequestsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>('pending');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [reasonView, setReasonView] = useState<ParentLinkRequest | null>(null);

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

  const revoke = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => revokeLinkRequest(id, reason),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Vínculo revocado');
      setRevokeId(null);
      setRevokeReason('');
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
                <th className="p-4 font-label-caps text-label-caps text-on-surface-variant min-w-[12rem]">Acciones</th>
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
                    <LinkRequestActions
                      row={r}
                      onApprove={() => approve.mutate(r.id)}
                      onReject={() => setRejectId(r.id)}
                      onRevoke={() => setRevokeId(r.id)}
                      onViewRejectReason={() => setReasonView(r)}
                      approvePending={approve.isPending}
                      revokePending={revoke.isPending && revokeId === r.id}
                    />
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

      <DashboardModal
        open={revokeId !== null}
        onClose={() => {
          setRevokeId(null);
          setRevokeReason('');
        }}
        title="Revocar vínculo"
      >
        <p className="text-sm text-on-surface-variant mb-4">
          El padre dejará de ver a este jugador en su cuenta. Opcional: indica un motivo (visible para el padre).
        </p>
        <textarea
          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface min-h-[100px] mb-4"
          value={revokeReason}
          onChange={(e) => setRevokeReason(e.target.value)}
          placeholder="Ej. Vínculo incorrecto o cambio de tutor"
        />
        <button
          type="button"
          disabled={revoke.isPending}
          onClick={() => {
            if (!revokeId) return;
            if (!window.confirm('¿Revocar este vínculo? El padre ya no verá al jugador.')) return;
            revoke.mutate({ id: revokeId, reason: revokeReason.trim() || undefined });
          }}
          className="w-full bg-error text-white font-label-caps py-3 rounded-lg disabled:opacity-60"
        >
          Confirmar revocación
        </button>
      </DashboardModal>

      <DashboardModal
        open={reasonView !== null}
        onClose={() => setReasonView(null)}
        title="Motivo de rechazo"
      >
        {reasonView ? (
          <div className="space-y-3 text-sm">
            <p className="text-on-surface-variant">
              <strong className="text-on-surface">
                {reasonView.parent?.firstName} {reasonView.parent?.lastName}
              </strong>
              {' · '}
              {reasonView.player?.firstName} {reasonView.player?.lastName}
            </p>
            <p className="whitespace-pre-wrap text-on-surface bg-surface-container/50 rounded-lg p-4 border border-outline-variant/20">
              {reasonView.rejectReason || 'Sin motivo registrado.'}
            </p>
            {reasonView.reviewedAt ? (
              <p className="text-xs text-on-surface-variant">
                Revisado: {new Date(reasonView.reviewedAt).toLocaleString('es-MX')}
              </p>
            ) : null}
          </div>
        ) : null}
      </DashboardModal>
    </div>
  );
}
