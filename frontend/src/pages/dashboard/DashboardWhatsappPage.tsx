import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { getWhatsAppStatus, reconnectWhatsApp, sendWhatsAppTest } from '@/api/whatsapp';
import { MaterialIcon } from '@/components/MaterialIcon';
import { Spinner } from '@/components/Spinner';

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
    refetchInterval: poll ? 4000 : false,
  });

  const status = q.data?.data;

  useEffect(() => {
    if (status?.state === 'open' || status?.state === 'disabled') {
      setPoll(false);
    } else {
      setPoll(true);
    }
  }, [status?.state]);

  const reconnectMut = useMutation({
    mutationFn: reconnectWhatsApp,
    onSuccess: () => {
      toast.success('Reconectando…');
      setPoll(true);
      void qc.invalidateQueries({ queryKey: ['whatsapp-status'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMut = useMutation({
    mutationFn: sendWhatsAppTest,
    onSuccess: (res) => {
      toast.success(res.message || 'Prueba enviada');
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
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">WhatsApp del club</h1>
        <p className="text-sm text-on-surface-variant mt-2">
          Número secundario para avisos a padres verificados (no masivo). Usa el chip solo para el club.
        </p>
      </div>

      {!status?.enabled ? (
        <div className="rounded-xl border border-error/40 bg-error-container/20 p-4 text-sm">
          WhatsApp no está activado en Render. Agrega{' '}
          <code className="text-primary">WHATSAPP_ENABLED=true</code> y disco persistente en{' '}
          <code className="text-primary">WHATSAPP_AUTH_DIR=/data/whatsapp-auth</code>.
        </div>
      ) : null}

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
          Padres con WhatsApp activo y elegibles:{' '}
          <strong className="text-on-surface">{status?.eligibleRecipients ?? 0}</strong>
        </p>
      </div>

      {status?.state === 'qr' && status.qrDataUrl ? (
        <div className="glass-panel rounded-xl p-5 flex flex-col items-center gap-3">
          <p className="text-sm text-on-surface-variant text-center">
            En el teléfono secundario: WhatsApp → Dispositivos vinculados → Vincular dispositivo → escanea:
          </p>
          <img src={status.qrDataUrl} alt="QR WhatsApp" className="rounded-lg bg-white p-2 max-w-[280px]" />
          <p className="text-[11px] text-on-surface-variant">El QR se actualiza solo cada pocos segundos.</p>
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
          disabled={!status?.enabled || reconnectMut.isPending}
          onClick={() => reconnectMut.mutate()}
          className="px-4 py-2 rounded-lg border border-outline-variant/40 font-label-caps text-[11px] hover:border-primary/40 disabled:opacity-50"
        >
          {reconnectMut.isPending ? 'Reconectando…' : 'Reconectar / nuevo QR'}
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
    </div>
  );
}
