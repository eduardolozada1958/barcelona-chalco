import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  createLinkRequest,
  myLinkRequests,
  myPlayers,
  type ParentLinkRequest,
} from '@/api/parents';
import { DashboardModal } from '@/components/DashboardModal';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';
import { playerPublicPath } from '@/utils/player-path';

const inputClass =
  'w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-3 text-on-surface font-body-md outline-none transition-colors uppercase tracking-wide';

const RELATIONSHIPS = [
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'tutora', label: 'Tutora' },
  { value: 'abuelo', label: 'Abuelo' },
  { value: 'abuela', label: 'Abuela' },
  { value: 'tio', label: 'Tío' },
  { value: 'tia', label: 'Tía' },
  { value: 'otro', label: 'Otro' },
] as const;

function statusLabel(status: string): { text: string; className: string } {
  if (status === 'pending') {
    return { text: 'Pendiente de aprobación', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  }
  if (status === 'rejected') {
    return { text: 'Rechazada', className: 'bg-error/15 text-error border-error/30' };
  }
  return { text: status, className: 'bg-surface-variant/30 text-on-surface-variant' };
}

export function MyPlayersPage() {
  const qc = useQueryClient();
  const [linkOpen, setLinkOpen] = useState(false);
  const [curp, setCurp] = useState('');
  const [relationship, setRelationship] = useState<string>('padre');
  const [isPrimary, setIsPrimary] = useState(false);

  const playersQ = useQuery({ queryKey: ['my-players'], queryFn: myPlayers });
  const requestsQ = useQuery({ queryKey: ['my-link-requests'], queryFn: myLinkRequests });

  const linkMut = useMutation({
    mutationFn: () =>
      createLinkRequest({
        curp: curp.replace(/\s/g, '').toUpperCase(),
        relationship,
        isPrimaryContact: isPrimary,
      }),
    onSuccess: (res) => {
      toast.success(res.message ?? 'Solicitud enviada');
      setLinkOpen(false);
      setCurp('');
      void qc.invalidateQueries({ queryKey: ['my-link-requests'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (playersQ.isLoading) return <Spinner />;

  const rows = (playersQ.data?.data ?? []) as {
    isPrimaryContact?: boolean;
    is_primary_contact?: boolean;
    relationship?: string;
    player?: Record<string, unknown>;
  }[];

  const requests = (requestsQ.data?.data ?? []) as ParentLinkRequest[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-stack-md gap-3">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Mis Jugadores</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Vincula a tus hijos con la CURP que registró el club
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLinkOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-label-caps text-label-caps px-5 py-3 rounded-lg hover:shadow-[0_0_16px_rgba(212,175,55,0.35)] transition-all shrink-0"
        >
          <MaterialIcon name="link" size={20} />
          Vincular un hijo
        </button>
      </div>

      {requests.length > 0 && (
        <section className="mb-stack-lg">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant mb-3 tracking-widest">
            Solicitudes de vínculo
          </h2>
          <div className="space-y-3">
            {requests.map((req) => {
              const st = statusLabel(req.status);
              return (
                <div
                  key={req.id}
                  className="bg-surface-container/40 border border-outline-variant/25 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-on-surface">
                      {req.player?.firstName} {req.player?.lastName}
                      {req.player?.category ? (
                        <span className="text-on-surface-variant font-normal"> · {req.player.category}</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-on-surface-variant mt-1 capitalize">
                      Parentesco: {req.relationship}
                    </p>
                    {req.status === 'rejected' && req.rejectReason ? (
                      <p className="text-sm text-error mt-2">Motivo: {req.rejectReason}</p>
                    ) : null}
                  </div>
                  <span className={`inline-flex self-start px-3 py-1 rounded-full text-xs font-label-caps border ${st.className}`}>
                    {st.text}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-stack-lg text-center bg-surface-container/30 rounded-xl border border-outline-variant/20 px-6">
          <MaterialIcon name="person_off" className="text-on-surface-variant mb-4" size={64} />
          <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
            Sin jugadores vinculados
          </p>
          <p className="font-body-md text-on-surface-variant max-w-md">
            Pulsa <strong>Vincular un hijo</strong> e ingresa la CURP de 18 caracteres. Si el jugador no está en la
            plantilla, contacta al entrenador para que lo registre con su CURP.
          </p>
        </div>
      ) : (
        <div className="grid gap-gutter sm:grid-cols-2">
          {rows.map((row, i) => {
            const pl = row.player ?? {};
            const pid = String(pl.id ?? i);
            const primary = row.is_primary_contact ?? row.isPrimaryContact;
            return (
              <div
                key={pid}
                className="bg-[#002366]/20 backdrop-blur-md border border-primary/20 rounded-xl p-6 relative overflow-hidden group hover:border-primary/40 transition-all"
              >
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/30">
                    <MaterialIcon name="person" className="text-primary" size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline-lg text-headline-lg-mobile text-on-surface truncate">
                      {String(pl.first_name)} {String(pl.last_name)}
                    </h3>
                    <p className="font-label-caps text-label-caps text-primary mt-1">{String(pl.category)}</p>
                    {row.relationship ? (
                      <p className="text-sm text-on-surface-variant mt-1 capitalize">Parentesco: {row.relationship}</p>
                    ) : null}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {primary ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps bg-primary/15 text-primary">
                          <MaterialIcon name="star" size={12} filled /> Contacto principal
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps bg-green-500/15 text-green-400 border border-green-500/30">
                        <MaterialIcon name="check_circle" size={12} /> Vinculado
                      </span>
                    </div>
                    <Link
                      to={playerPublicPath({ id: pid, slug: typeof pl.slug === 'string' ? pl.slug : null })}
                      className="mt-4 inline-flex items-center gap-1 text-primary hover:underline font-label-caps text-label-caps"
                    >
                      <MaterialIcon name="visibility" size={14} /> Ver perfil público
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DashboardModal open={linkOpen} onClose={() => setLinkOpen(false)} title="Vincular a tu hijo">
        <p className="text-sm text-on-surface-variant mb-4">
          La CURP debe coincidir con la que el entrenador registró en la plantilla. Tras enviar, un administrador
          aprobará el vínculo.
        </p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (curp.replace(/\s/g, '').length !== 18) {
              toast.error('La CURP debe tener 18 caracteres');
              return;
            }
            linkMut.mutate();
          }}
        >
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              CURP del jugador (18 caracteres)
            </label>
            <input
              className={inputClass}
              value={curp}
              onChange={(e) => setCurp(e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 18))}
              placeholder="AAAA000000HDFXXX00"
              maxLength={18}
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              Tu parentesco con el jugador
            </label>
            <select
              className={inputClass}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-outline-variant"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            Soy el contacto principal del jugador
          </label>
          <button
            type="submit"
            disabled={linkMut.isPending}
            className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {linkMut.isPending ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </form>
      </DashboardModal>
    </div>
  );
}
