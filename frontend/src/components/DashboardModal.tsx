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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4">
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
        className={`relative z-10 w-full max-w-[calc(100vw-1rem)] ${wide ? 'sm:max-w-2xl lg:max-w-3xl' : 'sm:max-w-lg'} max-h-[min(92dvh,100%)] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-2xl border border-outline-variant/30 bg-surface-container-low shadow-2xl p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]`}
      >
        <div className="sticky top-0 z-[1] -mx-4 px-4 sm:-mx-6 sm:px-6 pt-0 pb-3 mb-2 bg-surface-container-low/95 backdrop-blur-sm border-b border-outline-variant/15 flex items-start justify-between gap-3">
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

export const formActionsClass =
  'flex flex-col-reverse sm:flex-row flex-wrap justify-stretch sm:justify-end gap-2 mt-6 pt-4 border-t border-outline-variant/20 [&>button]:w-full sm:[&>button]:w-auto';
export const formLabelClass = 'block font-label-caps text-label-caps text-on-surface-variant mb-1.5';
export const formInputClass =
  'w-full min-h-[44px] rounded-xl border border-outline-variant/40 bg-surface-container px-3 py-2.5 text-on-surface text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 touch-manipulation';
export const formErrorClass = 'text-error text-xs mt-1';
