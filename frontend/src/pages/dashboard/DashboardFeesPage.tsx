import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { getFeesMatrix, syncPaymentHolds, updatePlayerFees, type FeeMatrixRow } from '@/api/fees';
import { AdminPrivateNotice } from '@/components/AdminPrivateNotice';
import { Spinner } from '@/components/Spinner';
import { COACH_PHONE_DISPLAY, COACH_WHATSAPP_URL } from '@/config/coach';

export function DashboardFeesPage() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const q = useQuery({
    queryKey: ['fees-matrix', period],
    queryFn: () => getFeesMatrix(`${period}-01`),
  });

  const syncMut = useMutation({
    mutationFn: () => syncPaymentHolds(),
    onSuccess: () => {
      toast.success('Bloqueos de padres recalculados');
      void qc.invalidateQueries({ queryKey: ['fees-matrix'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patchMut = useMutation({
    mutationFn: (args: {
      playerId: string;
      registrationPaid?: boolean;
      monthlyFeePaid?: boolean;
    }) =>
      updatePlayerFees(args.playerId, {
        periodMonth: `${period}-01`,
        registrationPaid: args.registrationPaid,
        monthlyFeePaid: args.monthlyFeePaid,
      }),
    onSuccess: () => {
      toast.success('Cuota actualizada');
      void qc.invalidateQueries({ queryKey: ['fees-matrix'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const payload = q.data?.data;
  const rows = payload?.rows ?? [];

  const stats = useMemo(() => {
    let mora = 0;
    for (const r of rows) {
      if (!r.registration_paid || !r.monthly_fee_paid) mora += 1;
    }
    return { mora, total: rows.length };
  }, [rows]);

  if (q.isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline-lg text-2xl text-on-surface">Cuotas y acceso de padres</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          <strong>Registro</strong> (alta) y <strong>mensualidad</strong> del mes, por jugador. Cada padre vinculado
          se evalúa aparte: si su hijo debe, solo esa cuenta se bloquea.
        </p>
      </div>

      <AdminPrivateNotice>
        Las cuotas y el estado de mora son confidenciales. No aparecen en partidos, jugadores públicos ni en el panel
        del entrenador. El padre bloqueado ve al iniciar sesión que debe contactar a Gabo ({COACH_PHONE_DISPLAY}).
      </AdminPrivateNotice>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="font-label-caps text-[10px] text-on-surface-variant block mb-1">Mes</label>
          <input
            type="month"
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="px-4 py-2 rounded-lg border border-outline-variant/40 text-sm hover:border-primary"
          onClick={() => syncMut.mutate()}
          disabled={syncMut.isPending}
        >
          {syncMut.isPending ? 'Recalculando…' : 'Recalcular bloqueos'}
        </button>
        <a
          href={COACH_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          WhatsApp Gabo
        </a>
      </div>

      <p className="text-xs text-on-surface-variant">
        Jugadores con mora este mes: {stats.mora} / {stats.total}. Los padres en la columna derecha muestran si su
        acceso está bloqueado por pago. Suspensión manual (otro motivo): <strong>Usuarios</strong> →{' '}
        <strong>Suspendido</strong>.
      </p>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/25">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-surface-container/60 text-left">
              <th className="px-3 py-2 font-label-caps text-[10px]">Jugador</th>
              <th className="px-3 py-2 font-label-caps text-[10px]">Registro</th>
              <th className="px-3 py-2 font-label-caps text-[10px]">Mensualidad</th>
              <th className="px-3 py-2 font-label-caps text-[10px]">Padres (acceso)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <FeeRow key={row.player_id} row={row} disabled={patchMut.isPending} onPatch={(p) => patchMut.mutate(p)} />
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="p-6 text-center text-on-surface-variant text-sm">No hay jugadores activos en plantilla.</p>
        ) : null}
      </div>
    </div>
  );
}

function FeeRow({
  row,
  disabled,
  onPatch,
}: {
  row: FeeMatrixRow;
  disabled: boolean;
  onPatch: (p: { playerId: string; registrationPaid?: boolean; monthlyFeePaid?: boolean }) => void;
}) {
  const name = `${row.first_name} ${row.last_name}`.trim();
  const mora = !row.registration_paid || !row.monthly_fee_paid;

  return (
    <tr className={`border-t border-outline-variant/15 ${mora ? 'bg-error/5' : ''}`}>
      <td className="px-3 py-2">
        <span className="font-medium text-on-surface">{name}</span>
        {row.jersey_number != null ? (
          <span className="text-on-surface-variant text-xs ml-1">#{row.jersey_number}</span>
        ) : null}
      </td>
      <td className="px-3 py-2">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={row.registration_paid}
            disabled={disabled}
            onChange={(e) => onPatch({ playerId: row.player_id, registrationPaid: e.target.checked })}
            className="h-4 w-4 rounded border-outline-variant text-primary"
          />
          <span className="text-xs">{row.registration_paid ? 'Pagado' : 'Pendiente'}</span>
        </label>
      </td>
      <td className="px-3 py-2">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={row.monthly_fee_paid}
            disabled={disabled}
            onChange={(e) => onPatch({ playerId: row.player_id, monthlyFeePaid: e.target.checked })}
            className="h-4 w-4 rounded border-outline-variant text-primary"
          />
          <span className="text-xs">{row.monthly_fee_paid ? 'Pagado' : 'Pendiente'}</span>
        </label>
      </td>
      <td className="px-3 py-2 text-xs text-on-surface-variant">
        {row.linked_parents.length === 0 ? (
          '—'
        ) : (
          <ul className="space-y-0.5">
            {row.linked_parents.map((p) => (
              <li key={p.user_id}>
                {p.email}
                {p.payment_hold ? (
                  <span className="text-error ml-1">(bloqueado)</span>
                ) : (
                  <span className="text-primary ml-1">(activo)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </td>
    </tr>
  );
}
