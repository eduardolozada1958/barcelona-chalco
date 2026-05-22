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
}

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
}: DashboardRowActionsProps) {
  return (
    <div className="flex flex-wrap items-stretch sm:items-center gap-1.5 w-full sm:w-auto sm:shrink-0 justify-stretch sm:justify-end">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-lg text-[11px] font-label-caps text-primary hover:bg-primary/10 border border-primary/30 touch-manipulation"
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
          className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-lg text-[11px] font-label-caps text-primary hover:bg-primary/10 disabled:opacity-50 touch-manipulation"
        >
          <MaterialIcon name="public" size={14} /> Publicar
        </button>
      )}
      {onArchive && (
        <button
          type="button"
          onClick={onArchive}
          disabled={archivePending}
          className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-lg text-[11px] font-label-caps text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/40 disabled:opacity-50 touch-manipulation"
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
          className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-lg text-[11px] font-label-caps text-error hover:bg-error/10 border border-error/30 disabled:opacity-50 touch-manipulation"
          title="Eliminar"
        >
          <MaterialIcon name="delete" size={14} /> Eliminar
        </button>
      )}
    </div>
  );
}

