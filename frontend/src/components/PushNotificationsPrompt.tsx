import { useState } from 'react';
import toast from 'react-hot-toast';

import { MaterialIcon } from '@/components/MaterialIcon';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISS_KEY = 'push_prompt_dismissed';

/**
 * Banner para activar avisos push (urgente, partido, entrenamiento, evento) al publicar.
 */
export function PushNotificationsPrompt() {
  const { state, busy, subscribe, unsubscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  if (dismissed || state === 'unsupported' || state === 'unconfigured' || state === 'loading') {
    return null;
  }

  if (state === 'subscribed') {
    return (
      <div className="mb-stack-md flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-on-surface">
          <MaterialIcon name="notifications_active" className="text-primary" size={20} />
          <span>Avisos activados en este dispositivo</span>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void unsubscribe().catch(() => toast.error('No se pudo desactivar'))}
          className="text-xs font-label-caps text-on-surface-variant hover:text-primary disabled:opacity-50"
        >
          Desactivar
        </button>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="mb-stack-md rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
        Las notificaciones están bloqueadas en el navegador. Actívalas en ajustes del sitio si quieres recibir avisos urgentes y de partidos.
      </div>
    );
  }

  return (
    <div className="mb-stack-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/30 bg-surface-container-low px-4 py-3">
      <div className="flex items-start gap-2 text-sm text-on-surface min-w-0">
        <MaterialIcon name="notifications" className="text-primary shrink-0 mt-0.5" size={20} />
        <span>
          <strong className="text-primary">Recibe avisos en el teléfono</strong>
          {' '}cuando publiquen algo urgente, partidos, entrenamientos o eventos (Android y navegador; en iPhone puede no llegar).
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void subscribe()
              .then(() => toast.success('Avisos activados'))
              .catch(() => toast.error('No se pudieron activar los avisos'))
          }
          className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-[10px] disabled:opacity-50"
        >
          {busy ? 'Activando…' : 'Activar avisos'}
        </button>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, '1');
            setDismissed(true);
          }}
          className="px-3 py-2 text-on-surface-variant text-xs hover:text-primary"
          aria-label="Cerrar"
        >
          <MaterialIcon name="close" size={18} />
        </button>
      </div>
    </div>
  );
}
