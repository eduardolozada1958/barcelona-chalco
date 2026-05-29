import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { getWhatsAppStatus, resetWhatsAppSession, sendWhatsAppTest } from '@/api/whatsapp';
import { MaterialIcon } from '@/components/MaterialIcon';
import { Spinner } from '@/components/Spinner';
import { WhatsAppDeliveryAudit } from '@/components/WhatsAppDeliveryAudit';

const STATE_LABEL: Record<string, string> = {
  disabled: 'Desactivado en el servidor',
  connecting: 'Conectando…',
  qr: 'Escanea el QR',
  open: 'Conectado',
  closed: 'Desconectado',
};

export function DashboardWhatsappPage() {
  const qc = useQueryClient();
  const [poll, setPoll] = useState(true);

  const q = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: getWhatsAppStatus,
    refetchInterval: poll ? 3000 : false,
    staleTime: 0,
    gcTime: 0,
  });

  const status = q.data?.data;

  useEffect(() => {
    if (status?.state === 'open' || status?.state === 'disabled') {
      setPoll(false);
    } else {
      setPoll(true);
    }
  }, [status?.state]);

  const resetMut = useMutation({
    mutationFn: resetWhatsAppSession,
    onSuccess: () => {
      toast.success('Sesión borrada. Espera el QR (10–30 s)…');
      setPoll(true);
      void qc.invalidateQueries({ queryKey: ['whatsapp-status'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMut = useMutation({
    mutationFn: sendWhatsAppTest,
    onSuccess: (res) => {
      const to = (res.data as { sentTo?: { name: string; phone: string } } | undefined)?.sentTo;
      toast.success(
        to
          ? `Enviado a ${to.name} (${to.phone})`
          : (res.message || 'Prueba enviada'),
      );
      void qc.invalidateQueries({ queryKey: ['whatsapp-delivery-batches'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">WhatsApp del club</h1>
        <p className="text-sm text-on-surface-variant mt-2">
          Número secundario para avisos a padres verificados (no masivo). Usa el chip solo para el club.
        </p>
      </div>

      {!status?.enabled ? (
        <div className="rounded-xl border border-error/40 bg-error-container/20 p-4 text-sm">
          WhatsApp no está activado en Render. Agrega <code className="text-primary">WHATSAPP_ENABLED=true</code>.
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant">
          Sesión guardada en:{' '}
          <strong className="text-on-surface">
            {status.authStorage === 'supabase' ? 'Supabase (compatible plan Free)' : 'Disco local'}
          </strong>
        </p>
      )}

      <div className="glass-panel rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Estado</span>
          <span
            className={`font-label-caps text-label-caps px-3 py-1 rounded-full border ${
              status?.state === 'open'
                ? 'border-primary/50 text-primary bg-primary/10'
                : 'border-outline-variant/40 text-on-surface-variant'
            }`}
          >
            {STATE_LABEL[status?.state ?? 'closed'] ?? status?.state}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant">
          Padres que recibirán avisos (partidos, resultados, avisos, galería, MVP):{' '}
          <strong className="text-on-surface">{status?.eligibleRecipients ?? 0}</strong>
        </p>
        {status?.diagnostics ? (
          <ul className="text-xs text-on-surface-variant space-y-1 mt-2">
            {status.diagnostics.optedOut > 0 ? (
              <li>• {status.diagnostics.optedOut} desactivaron avisos en Mi perfil</li>
            ) : null}
            {status.diagnostics.noApprovedChild > 0 ? (
              <li>• {status.diagnostics.noApprovedChild} sin hijo vinculado aprobado</li>
            ) : null}
            {status.diagnostics.emailNotVerified > 0 ? (
              <li>• {status.diagnostics.emailNotVerified} con correo sin verificar</li>
            ) : null}
            {status.diagnostics.noPhone > 0 ? (
              <li>• {status.diagnostics.noPhone} sin teléfono válido en Mi perfil</li>
            ) : null}
            {status.diagnostics.accountNotActive > 0 ? (
              <li>• {status.diagnostics.accountNotActive} con cuenta inactiva</li>
            ) : null}
            {status.diagnostics.duplicatePhone > 0 ? (
              <li>• {status.diagnostics.duplicatePhone} con teléfono duplicado (omitidos)</li>
            ) : null}
          </ul>
        ) : null}
        <p className="text-xs text-on-surface-variant mt-2">
          Los avisos se activan automáticamente cuando el padre verifica correo, vincula un hijo aprobado y tiene
          teléfono. Al publicar avisos, galería, MVP, resultados o crear partidos, el mensaje se envía a{' '}
          <strong className="text-on-surface">todos</strong> esos padres (uno por uno, con pausa entre envíos).
          «Enviar prueba» solo manda a <strong className="text-on-surface">uno</strong> para comprobar la conexión.
        </p>
        {status?.testRecipient ? (
          <p className="text-xs text-on-surface-variant">
            «Enviar prueba» va a:{' '}
            <strong className="text-on-surface">
              {status.testRecipient.name} ({status.testRecipient.phone})
            </strong>
            {status.testRecipient.phoneSource === 'user_phone'
              ? ' — teléfono de Mi perfil'
              : ' — teléfono del expediente en admin'}
          </p>
        ) : null}
      </div>

      {status?.linkingAfterQr ? (
        <div className="glass-panel rounded-xl p-5 flex flex-col items-center gap-3 border border-primary/30">
          <Spinner />
          <p className="text-sm text-primary text-center font-medium">
            QR escaneado. Vinculando… no cierres esta página ni pulses «Nuevo QR» (10–20 s).
          </p>
        </div>
      ) : null}

      {(status?.recovering || (status?.pairingWaitSec ?? 0) > 0) && status?.state !== 'qr' && !status?.linkingAfterQr ? (
        <div className="glass-panel rounded-xl p-5 flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-on-surface-variant text-center">
            {(status?.pairingWaitSec ?? 0) > 0
              ? `Conflicto de sesión. Espera ${status?.pairingWaitSec ?? 0} s; luego aparecerá un QR nuevo.`
              : 'Preparando sesión… No escanees hasta que aparezca el QR.'}
          </p>
        </div>
      ) : null}

      {status?.state === 'connecting' && !status?.recovering && !(status?.pairingWaitSec ?? 0) ? (
        <div className="glass-panel rounded-xl p-5 flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-on-surface-variant text-center">
            Generando QR… Si tardó más de 1 minuto, pulsa de nuevo «Nuevo QR».
          </p>
        </div>
      ) : null}

      {(status?.state === 'closed' && (status.reconnectAttempts ?? 0) >= 10) ? (
        <div className="rounded-xl border border-error/40 bg-error-container/20 p-4 text-sm space-y-2">
          <p>
            El servidor dejó de reintentar solo. Pulsa <strong>Nuevo QR</strong> para borrar la sesión
            antigua y volver a vincular.
          </p>
        </div>
      ) : null}

      {status?.state === 'closed' && status?.enabled ? (
        <p className="text-sm text-on-surface-variant">
          Si cerraste sesión en el teléfono del club, pulsa <strong>Nuevo QR</strong> (no solo «Actualizar»).
          Escanea con el chip del club (3349420820).
        </p>
      ) : null}

      {status?.state === 'qr' && status.qrDataUrl && !(status?.pairingWaitSec ?? 0) ? (
        <div className="glass-panel rounded-xl p-5 flex flex-col items-center gap-3">
          <p className="text-sm text-on-surface-variant text-center">
            En el teléfono del club (3349420820): WhatsApp → Dispositivos vinculados →{' '}
            <strong>cierra sesiones viejas</strong> → Vincular dispositivo → escanea en menos de 20 s:
          </p>
          <img src={status.qrDataUrl} alt="QR WhatsApp" className="rounded-lg bg-white p-2 max-w-[280px]" />
          <p className="text-[11px] text-on-surface-variant text-center">
            El mensaje llega al celular del padre (Mi perfil), no al chip del club. Revisa WhatsApp en ese número,
            carpeta Solicitudes y chats archivados.
          </p>
        </div>
      ) : null}

      {status?.state === 'open' ? (
        <p className="text-sm text-primary flex items-center gap-2">
          <MaterialIcon name="check_circle" size={20} filled />
          Listo para enviar al publicar avisos o crear partidos programados.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={
            !status?.enabled ||
            resetMut.isPending ||
            status?.state === 'qr' ||
            status?.linkingAfterQr ||
            status?.recovering ||
            (status?.pairingWaitSec ?? 0) > 0
          }
          onClick={() => resetMut.mutate()}
          className="px-4 py-2 rounded-lg border border-outline-variant/40 font-label-caps text-[11px] hover:border-primary/40 disabled:opacity-50"
        >
          {resetMut.isPending ? 'Preparando QR…' : 'Nuevo QR / vincular de nuevo'}
        </button>
        <button
          type="button"
          disabled={!status?.enabled || status?.state !== 'open' || testMut.isPending}
          onClick={() => testMut.mutate()}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-[11px] disabled:opacity-50"
        >
          {testMut.isPending ? 'Enviando…' : 'Enviar prueba'}
        </button>
        <button
          type="button"
          onClick={() => void qc.invalidateQueries({ queryKey: ['whatsapp-status'] })}
          className="px-4 py-2 rounded-lg border border-outline-variant/40 font-label-caps text-[11px]"
        >
          Actualizar estado
        </button>
      </div>

      <div className="text-[11px] text-on-surface-variant space-y-2 border-t border-outline-variant/20 pt-4">
        <p>Se envía solo a padres con: cuenta activa, correo verificado, hijo aprobado, teléfono en su perfil y opción activada en «Mi perfil».</p>
        <p>Avisos: urgentes, partido, entrenamiento y evento. Partidos nuevos programados también (si no desactivas WHATSAPP_NOTIFY_MATCHES).</p>
      </div>

      <WhatsAppDeliveryAudit />
    </div>
  );
}
