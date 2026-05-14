import type { ReactNode } from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';

interface DashboardModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Wider layout for forms with many fields */
  wide?: boolean;
}

export function DashboardModal({ open, title, onClose, children, wide }: DashboardModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar diálogo"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-modal-title"
        className={`relative z-10 w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface-container-low shadow-2xl p-stack-md`}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 id="dashboard-modal-title" className="font-headline-lg text-headline-lg-mobile text-on-surface pr-2">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 rounded-lg text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
            aria-label="Cerrar"
          >
            <MaterialIcon name="close" size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const formLabelClass = 'block font-label-caps text-label-caps text-on-surface-variant mb-1';
export const formInputClass =
  'w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';
export const formErrorClass = 'text-error text-xs mt-1';
export const formActionsClass = 'flex flex-wrap justify-end gap-2 mt-6 pt-4 border-t border-outline-variant/20';
