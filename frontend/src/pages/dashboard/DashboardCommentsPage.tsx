import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  approveComment,
  deleteComment,
  listAdminComments,
  rejectComment,
  type CommentItem,
} from '@/api/comments';
import { DashboardModal } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

const STATUS_TABS = [
  { value: 'all', label: 'Todos' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'pending', label: 'Pendientes' },
] as const;

const RESOURCE_LABEL: Record<string, string> = {
  notice:       'Aviso',
  gallery_post: 'Galería',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function DashboardCommentsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>('all');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const q = useQuery({
    queryKey: ['comments-admin', status],
    queryFn:  () => listAdminComments({ status: status as never, page: 1, limit: 100 }),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveComment(id),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Aprobado');
      void qc.invalidateQueries({ queryKey: ['comments-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rejectComment(id, reason),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Rechazado');
      setRejectId(null);
      setRejectReason('');
      void qc.invalidateQueries({ queryKey: ['comments-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      toast.success('Eliminado');
      void qc.invalidateQueries({ queryKey: ['comments-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <Spinner />;

  const rows = (q.data?.data ?? []) as CommentItem[];

  return (
    <div>
      <div className="mb-stack-md">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Comentarios</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Revisa, rechaza o elimina los comentarios publicados en avisos y galería.
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
          <MaterialIcon name="forum" size={48} className="text-on-surface-variant mx-auto mb-3" />
          <p className="text-on-surface-variant">No hay comentarios en esta categoría.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-outline-variant/20 bg-surface-container/30 p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div>
                  <span className="font-medium text-on-surface">{c.author?.fullName ?? 'Usuario'}</span>
                  <span className="text-xs text-on-surface-variant ml-2 capitalize">
                    {c.author?.role ?? ''} · {formatDate(c.createdAt)}
                  </span>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {RESOURCE_LABEL[c.resourceType] ?? c.resourceType} · ID {c.resourceId.slice(0, 8)}…
                  </p>
                </div>
                <span
                  className={`text-[10px] font-label-caps px-2.5 py-1 rounded-full border ${
                    c.status === 'pending'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : c.status === 'approved'
                        ? 'bg-green-500/15 text-green-400 border-green-500/30'
                        : 'bg-error/15 text-error border-error/30'
                  }`}
                >
                  {c.status === 'pending'
                    ? 'Pendiente'
                    : c.status === 'approved'
                      ? 'Aprobado'
                      : 'Rechazado'}
                </span>
              </div>
              <p className="text-on-surface whitespace-pre-wrap">{c.content}</p>
              {c.status === 'rejected' && c.rejectReason ? (
                <p className="mt-2 text-xs text-error">Motivo: {c.rejectReason}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 mt-3">
                {c.status === 'pending' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => approve.mutate(c.id)}
                      disabled={approve.isPending}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-label-caps bg-primary/15 text-primary hover:bg-primary hover:text-on-primary transition-colors"
                    >
                      <MaterialIcon name="check" size={14} /> Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectId(c.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-label-caps bg-error/15 text-error hover:bg-error hover:text-white transition-colors"
                    >
                      <MaterialIcon name="close" size={14} /> Rechazar
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Eliminar este comentario?')) remove.mutate(c.id);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-label-caps bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:border-error/50 hover:text-error transition-colors"
                >
                  <MaterialIcon name="delete" size={14} /> Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DashboardModal
        open={rejectId !== null}
        onClose={() => {
          setRejectId(null);
          setRejectReason('');
        }}
        title="Rechazar comentario"
      >
        <p className="text-sm text-on-surface-variant mb-4">
          Opcional: el motivo será visible al autor del comentario.
        </p>
        <textarea
          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface min-h-[100px] mb-4"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Ej. Lenguaje inapropiado / fuera de tema"
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
