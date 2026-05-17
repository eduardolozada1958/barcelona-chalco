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

  if (state === 'ios_needs_install') {
    return (
      <div className="mb-stack-md rounded-xl border border-primary/30 bg-surface-container-low px-4 py-4 text-sm text-on-surface">
        <div className="flex items-start gap-2">
          <MaterialIcon name="phone_iphone" className="text-primary shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-medium text-primary mb-2">Avisos en iPhone / iPad (Safari)</p>
            <p className="text-on-surface-variant mb-3">
              Apple solo permite notificaciones si abres el sitio desde el <strong>icono en la pantalla de inicio</strong>, no desde Safari normal.
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant mb-0">
              <li>En Safari, pulsa <strong>Compartir</strong> (cuadrado con flecha).</li>
              <li>Elige <strong>Añadir a pantalla de inicio</strong>.</li>
              <li>Abre la app desde el icono nuevo.</li>
              <li>Pulsa <strong>Activar avisos</strong> y acepta el permiso.</li>
            </ol>
          </div>
        </div>
      </div>
    );
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
          {' '}cuando publiquen algo urgente, partidos, entrenamientos o eventos. En Mac con Safari funciona aquí; en iPhone sigue los pasos de arriba si aplica.
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
