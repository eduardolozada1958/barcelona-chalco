import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { getMyAccountSummary, type ParentAccountSummary } from '@/api/parents';
import { MaterialIcon } from '@/components/MaterialIcon';
import { Spinner } from '@/components/Spinner';
import { COACH_WHATSAPP_URL } from '@/config/coach';

function monthLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  if (!y || !m) return iso;
  return new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

export function ParentAccountStatus({ compact = false }: { compact?: boolean }) {
  const q = useQuery({
    queryKey: ['parent-account-summary'],
    queryFn: getMyAccountSummary,
  });

  if (q.isLoading) {
    return (
      <div className="rounded-xl border border-outline-variant/25 p-6 flex justify-center">
        <Spinner />
      </div>
    );
  }

  const data = q.data?.data as ParentAccountSummary | undefined;
  if (!data) return null;

  const hasChildren = data.children.length > 0;
  const anyUnpaid = data.children.some((c) => !c.allPaid);
  const wa = data.coach.whatsapp || COACH_WHATSAPP_URL;

  return (
    <section
      className={`rounded-xl border ${
        data.paymentHold ? 'border-error/40 bg-error/5' : 'border-primary/25 bg-primary/5'
      } p-stack-md space-y-4`}
    >
      <div className="flex items-start gap-3">
        <MaterialIcon
          name={data.paymentHold ? 'payments' : 'account_balance_wallet'}
          size={28}
          className={data.paymentHold ? 'text-error shrink-0' : 'text-primary shrink-0'}
        />
        <div>
          <h3 className="font-headline-lg-mobile text-lg text-on-surface">
            Cuotas y asistencia de tus hijos
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Información privada de tu familia — {monthLabel(data.periodMonth)}. No es pública en el sitio.
          </p>
        </div>
      </div>

      {data.paymentHold ? (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm">
          <p className="text-on-surface font-medium">Acceso restringido por adeudo</p>
          <p className="text-on-surface-variant mt-1">
            Hay registro o mensualidad pendiente. Para activar tu cuenta, contacta a{' '}
            <strong>{data.coach.name}</strong> al {data.coach.phone}.
          </p>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-primary font-label-caps text-[11px] hover:underline"
          >
            <MaterialIcon name="chat" size={14} />
            WhatsApp {data.coach.name}
          </a>
        </div>
      ) : anyUnpaid ? (
        <p className="text-sm text-amber-400/90">
          Tienes pagos pendientes en el mes. Regulariza con {data.coach.name} para evitar bloqueo de acceso.
        </p>
      ) : hasChildren ? (
        <p className="text-sm text-primary">Tus cuotas del mes están al corriente.</p>
      ) : (
        <p className="text-sm text-on-surface-variant">
          Aún no tienes hijos vinculados.{' '}
          <Link to="/dashboard/mis-jugadores" className="text-primary hover:underline">
            Solicita el vínculo con CURP
          </Link>
          .
        </p>
      )}

      {hasChildren ? (
        <ul className={`space-y-3 ${compact ? '' : ''}`}>
          {data.children.map((c) => (
            <li
              key={c.playerId}
              className="rounded-lg border border-outline-variant/20 bg-surface-container/30 px-4 py-3"
            >
              <p className="font-medium text-on-surface">
                {c.firstName} {c.lastName}
              </p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <StatusPill ok={c.registrationPaid} labelOk="Registro pagado" labelNo="Registro pendiente" />
                <StatusPill ok={c.monthlyFeePaid} labelOk="Mensualidad pagada" labelNo="Mensualidad pendiente" />
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2">
                Asistencia del mes: {c.attendancePresent} de {c.attendanceTotal} sesiones
                {c.attendanceTotal > 0
                  ? ` (${Math.round((c.attendancePresent / c.attendanceTotal) * 100)}%)`
                  : ''}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {!compact ? (
        <p className="text-[10px] text-on-surface-variant">
          El detalle completo del club lo gestiona el administrador. Aquí solo ves a tus hijos vinculados.
        </p>
      ) : null}
    </section>
  );
}

function StatusPill({
  ok,
  labelOk,
  labelNo,
}: {
  ok: boolean;
  labelOk: string;
  labelNo: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
        ok ? 'bg-primary/15 text-primary' : 'bg-error/10 text-error'
      }`}
    >
      <MaterialIcon name={ok ? 'check_circle' : 'cancel'} size={14} />
      {ok ? labelOk : labelNo}
    </span>
  );
}
