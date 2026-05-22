import { MaterialIcon } from '@/components/MaterialIcon';

interface DashboardRowActionsProps {
  onEdit?: () => void;
  /** Texto del botón de edición (p. ej. «Goles y tarjetas» en resultados). */
  editLabel?: string;
  onDelete?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  showPublish?: boolean;
  isPublished?: boolean;
  isArchived?: boolean;
  publishPending?: boolean;
  deletePending?: boolean;
  archivePending?: boolean;
  /**
   * wrap: filas de lista (avisos, partidos).
   * grid: tarjetas estrechas (galería) — botones en rejilla 2 columnas, ancho completo.
   */
  layout?: 'wrap' | 'grid';
}

const btnBase =
  'inline-flex items-center justify-center gap-1 rounded-lg text-[11px] font-label-caps touch-manipulation min-h-[36px]';

export function DashboardRowActions({
  onEdit,
  editLabel = 'Editar',
  onDelete,
  onPublish,
  onArchive,
  showPublish,
  isPublished,
  isArchived,
  publishPending,
  deletePending,
  archivePending,
  layout = 'wrap',
}: DashboardRowActionsProps) {
  const isGrid = layout === 'grid';

  const containerClass = isGrid
    ? 'grid grid-cols-2 gap-1.5 w-full min-w-0 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end'
    : 'flex flex-wrap items-center gap-1.5 w-full min-w-0 max-w-full justify-start sm:justify-end';

  const btnClass = (extra: string) =>
    isGrid
      ? `${btnBase} w-full px-2 py-2 lg:w-auto lg:px-2.5 lg:py-1.5 ${extra}`
      : `${btnBase} shrink-0 px-2.5 py-2 sm:py-1.5 ${extra}`;

  return (
    <div className={containerClass}>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className={btnClass('text-primary hover:bg-primary/10 border border-primary/30')}
          title="Editar"
        >
          <MaterialIcon name="edit" size={14} /> {editLabel}
        </button>
      )}
      {showPublish && !isPublished && onPublish && (
        <button
          type="button"
          onClick={onPublish}
          disabled={publishPending}
          className={btnClass('text-primary hover:bg-primary/10 border border-primary/30 disabled:opacity-50')}
        >
          <MaterialIcon name="public" size={14} /> Publicar
        </button>
      )}
      {onArchive && (
        <button
          type="button"
          onClick={onArchive}
          disabled={archivePending}
          className={btnClass(
            'text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/40 disabled:opacity-50',
          )}
          title={isArchived ? 'Restaurar' : 'Archivar'}
        >
          <MaterialIcon name={isArchived ? 'unarchive' : 'inventory_2'} size={14} />
          {isArchived ? 'Restaurar' : 'Archivar'}
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={deletePending}
          className={btnClass('text-error hover:bg-error/10 border border-error/30 disabled:opacity-50')}
          title="Eliminar"
        >
          <MaterialIcon name="delete" size={14} /> Eliminar
        </button>
      )}
    </div>
  );
}
