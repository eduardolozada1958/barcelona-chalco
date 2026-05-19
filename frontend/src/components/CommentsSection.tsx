import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  createComment,
  deleteComment,
  listMyCommentsForResource,
  listPublicComments,
  type CommentItem,
  type CommentResourceType,
} from '@/api/comments';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcon } from '@/components/MaterialIcon';

interface Props {
  resourceType: CommentResourceType;
  resourceId:   string;
}

const MAX_LEN = 1000;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day:    '2-digit',
      month:  'short',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function roleLabel(role?: string): { text: string; className: string } | null {
  if (role === 'admin') {
    return { text: 'Admin', className: 'bg-primary/15 text-primary border-primary/30' };
  }
  if (role === 'coach') {
    return { text: 'Entrenador', className: 'bg-secondary/15 text-secondary border-secondary/30' };
  }
  return null;
}

export function CommentsSection({ resourceType, resourceId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState('');

  const publicQ = useQuery({
    queryKey: ['comments-public', resourceType, resourceId],
    queryFn:  () => listPublicComments({ resourceType, resourceId, page: 1, limit: 50 }),
    enabled:  Boolean(resourceId),
  });

  const mineQ = useQuery({
    queryKey: ['comments-mine', resourceType, resourceId],
    queryFn:  () => listMyCommentsForResource({ resourceType, resourceId }),
    enabled:  Boolean(resourceId) && Boolean(user),
  });

  const create = useMutation({
    mutationFn: () => createComment({ resourceType, resourceId, content: content.trim() }),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Comentario enviado');
      setContent('');
      void qc.invalidateQueries({ queryKey: ['comments-public', resourceType, resourceId] });
      void qc.invalidateQueries({ queryKey: ['comments-mine', resourceType, resourceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      toast.success('Comentario eliminado');
      void qc.invalidateQueries({ queryKey: ['comments-public', resourceType, resourceId] });
      void qc.invalidateQueries({ queryKey: ['comments-mine', resourceType, resourceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approved = (publicQ.data?.data ?? []) as CommentItem[];
  const mine = (mineQ.data?.data ?? []) as CommentItem[];
  const total = approved.length;

  const isParent = user?.role === 'parent';
  const isStaff = user?.role === 'admin' || user?.role === 'coach';

  return (
    <section className="mt-stack-lg border-t border-outline-variant/20 pt-stack-md">
      <div className="flex items-center gap-2 mb-stack-md">
        <MaterialIcon name="forum" className="text-primary" />
        <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface">
          Comentarios
          {total > 0 ? <span className="text-on-surface-variant font-normal"> · {total}</span> : null}
        </h2>
      </div>

      {!user ? (
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container/40 p-4 mb-stack-md text-sm text-on-surface-variant">
          <Link to="/login" className="text-primary hover:underline font-medium">Inicia sesión</Link>{' '}
          o{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">crea una cuenta</Link>{' '}
          para poder comentar.
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (content.trim().length < 2) {
              toast.error('Escribe al menos 2 caracteres');
              return;
            }
            create.mutate();
          }}
          className="mb-stack-md rounded-xl border border-outline-variant/20 bg-surface-container/40 p-4"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
            placeholder={
              isParent
                ? 'Escribe un comentario (un administrador lo revisará antes de publicarlo).'
                : 'Escribe un comentario.'
            }
            className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary rounded-lg px-3 py-2 text-on-surface min-h-[80px] outline-none transition-colors"
          />
          <div className="flex items-center justify-between mt-2 gap-3">
            <span className="text-xs text-on-surface-variant">
              {content.length}/{MAX_LEN}
              {isParent ? ' · Tu comentario pasará por moderación.' : ''}
            </span>
            <button
              type="submit"
              disabled={create.isPending || content.trim().length < 2}
              className="inline-flex items-center gap-2 bg-primary text-on-primary font-label-caps text-label-caps px-4 py-2 rounded-lg disabled:opacity-60"
            >
              <MaterialIcon name="send" size={16} />
              {create.isPending ? 'Enviando…' : 'Comentar'}
            </button>
          </div>
        </form>
      )}

      {mine.length > 0 ? (
        <div className="mb-stack-md space-y-2">
          {mine.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border px-4 py-3 text-sm ${
                c.status === 'pending'
                  ? 'border-amber-500/30 bg-amber-500/10'
                  : 'border-error/30 bg-error/10'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="font-label-caps text-xs">
                  {c.status === 'pending' ? 'Tu comentario · pendiente de moderación' : 'Tu comentario · rechazado'}
                </span>
                <button
                  type="button"
                  onClick={() => remove.mutate(c.id)}
                  className="text-on-surface-variant hover:text-error"
                  aria-label="Eliminar comentario"
                >
                  <MaterialIcon name="delete" size={16} />
                </button>
              </div>
              <p className="text-on-surface whitespace-pre-wrap">{c.content}</p>
              {c.status === 'rejected' && c.rejectReason ? (
                <p className="mt-2 text-xs text-error">Motivo: {c.rejectReason}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {publicQ.isLoading ? (
        <p className="text-sm text-on-surface-variant">Cargando comentarios…</p>
      ) : approved.length === 0 ? (
        <p className="text-sm text-on-surface-variant">
          Aún no hay comentarios. Sé la primera persona en comentar.
        </p>
      ) : (
        <ul className="space-y-3">
          {approved.map((c) => {
            const role = roleLabel(c.author?.role);
            const canDelete = user && (isStaff || c.userId === user.id);
            const initial = (c.author?.fullName ?? '?').trim().charAt(0).toUpperCase() || '?';
            return (
              <li
                key={c.id}
                className="rounded-xl border border-outline-variant/20 bg-surface-container/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-medium shrink-0 overflow-hidden">
                    {c.author?.avatarUrl ? (
                      <img src={c.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-on-surface">
                        {c.author?.fullName ?? 'Usuario'}
                      </span>
                      {role ? (
                        <span className={`text-[10px] font-label-caps px-2 py-0.5 rounded-full border ${role.className}`}>
                          {role.text}
                        </span>
                      ) : null}
                      <span className="text-xs text-on-surface-variant">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-on-surface whitespace-pre-wrap break-words">{c.content}</p>
                  </div>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('¿Eliminar este comentario?')) remove.mutate(c.id);
                      }}
                      className="text-on-surface-variant hover:text-error"
                      aria-label="Eliminar comentario"
                    >
                      <MaterialIcon name="delete" size={18} />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
