import clsx from 'clsx';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';

/** Contenedor estándar de cada pantalla del panel. */
export function DashboardPageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('dashboard-page min-w-0', className)}>{children}</div>;
}

export function DashboardPageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="dashboard-page-header">
      <div className="min-w-0 flex-1">
        <h1 className="dashboard-page-title">{title}</h1>
        {description ? <div className="dashboard-page-subtitle">{description}</div> : null}
      </div>
      {actions ? <div className="dashboard-page-actions">{actions}</div> : null}
    </header>
  );
}

export function DashboardToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('dashboard-toolbar', className)}>{children}</div>;
}

export function DashboardField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('min-w-0', className)}>
      <span className="dashboard-field-label">{label}</span>
      {children}
    </div>
  );
}

export function DashboardListCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <article className={clsx('dashboard-list-card', className)}>{children}</article>;
}

export function DashboardListCardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1', className)}>{children}</div>;
}

export function DashboardListCardActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col gap-2 w-full sm:w-auto sm:shrink-0 sm:items-end', className)}>
      {children}
    </div>
  );
}

export function DashboardIconBadge({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant/15 shrink-0',
        className,
      )}
    >
      <MaterialIcon name={icon} className="text-primary" size={22} />
    </div>
  );
}

export function DashboardTableFrame({
  children,
  className,
  maxHeight,
}: {
  children: ReactNode;
  className?: string;
  maxHeight?: string;
}) {
  return (
    <div className={clsx('relative min-w-0', className)}>
      <div
        className="dashboard-table-scroll overflow-auto rounded-xl border border-outline-variant/25 bg-surface-container/20"
        style={maxHeight ? { maxHeight } : undefined}
      >
        {children}
      </div>
      <p className="dashboard-table-hint">
        <MaterialIcon name="swipe_left" size={14} />
        Desliza horizontalmente para ver más columnas
      </p>
    </div>
  );
}

export function DashboardPrimaryButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={clsx('dashboard-btn-primary', className)} {...props}>
      {children}
    </button>
  );
}

export function DashboardSecondaryButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={clsx('dashboard-btn-secondary', className)} {...props}>
      {children}
    </button>
  );
}

export function DashboardMonthInput({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input type="month" className={clsx('dashboard-input', className)} {...props} />;
}

export function DashboardSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-label-caps text-label-caps text-on-surface-variant tracking-widest mb-3 sm:mb-4">
      {children}
    </h2>
  );
}

export function DashboardEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-empty-state">
      {children}
    </div>
  );
}
