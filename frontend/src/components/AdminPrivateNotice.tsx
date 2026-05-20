import type { ReactNode } from 'react';

import { MaterialIcon } from '@/components/MaterialIcon';

/** Aviso de datos confidenciales (solo panel admin). */
export function AdminPrivateNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-on-surface-variant">
      <MaterialIcon name="lock" size={20} className="text-primary shrink-0 mt-0.5" />
      <div>
        <p className="font-label-caps text-[10px] text-primary mb-1">Uso interno — no público</p>
        {children ?? (
          <p>
            Esta información no aparece en el sitio público ni en el panel de padres o entrenadores.
            Solo administradores con sesión activa pueden verla.
          </p>
        )}
      </div>
    </div>
  );
}
