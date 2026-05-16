import { MaterialIcon } from '@/components/MaterialIcon';

interface DashboardRowActionsProps {
  onEdit?: () => void;
  /** Texto del botón de edición (p. ej. «Goles y tarjetas» en resultados). */
  editLabel?: string;
  onDelete?: () => void;
  onPublish?: () => void;
  showPublish?: boolean;
  isPublished?: boolean;
  publishPending?: boolean;
  deletePending?: boolean;
}

export function DashboardRowActions({
  onEdit,
  editLabel = 'Editar',
  onDelete,
  onPublish,
  showPublish,
  isPublished,
  publishPending,
  deletePending,
}: DashboardRowActionsProps) {
  return (
    <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-label-caps text-primary hover:bg-primary/10 border border-primary/30"
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
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-label-caps text-primary hover:bg-primary/10 disabled:opacity-50"
        >
          <MaterialIcon name="public" size={14} /> Publicar
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={deletePending}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-label-caps text-error hover:bg-error/10 border border-error/30 disabled:opacity-50"
          title="Eliminar"
        >
          <MaterialIcon name="delete" size={14} /> Eliminar
        </button>
      )}
    </div>
  );
}

