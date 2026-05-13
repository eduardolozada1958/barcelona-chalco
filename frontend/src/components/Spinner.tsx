import { MaterialIcon } from './MaterialIcon';

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-on-surface-variant">
      <MaterialIcon name="progress_activity" className="text-primary animate-spin" size={40} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
