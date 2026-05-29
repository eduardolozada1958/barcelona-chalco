import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  getWhatsAppDeliveryBatch,
  listWhatsAppDeliveryBatches,
  type WhatsAppDeliveryBatchDetail,
  type WhatsAppDeliveryBatchSummary,
  type WhatsAppDeliveryEntry,
} from '@/api/whatsapp';
import { Spinner } from '@/components/Spinner';
import { MaterialIcon } from '@/components/MaterialIcon';

const LINK_STATUS_LABEL: Record<string, string> = {
  linked: 'Vinculado (aprobado)',
  pending: 'Solicitud pendiente',
  unlinked: 'Sin vínculo',
  rejected_only: 'Solo rechazadas',
  unknown: '—',
};

const OUTCOME_LABEL: Record<string, { text: string; className: string }> = {
  sent:    { text: 'Enviado', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  failed:  { text: 'Falló', className: 'bg-error/15 text-error border-error/30' },
  skipped: { text: 'No enviado', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

function EntryRow({ e }: { e: WhatsAppDeliveryEntry }) {
  const st = OUTCOME_LABEL[e.outcome] ?? OUTCOME_LABEL.skipped;
  return (
    <tr className="border-t border-outline-variant/15">
      <td className="px-2 py-2 text-on-surface text-sm">
        <div className="font-medium">{e.parentName}</div>
        {e.email ? <div className="text-[11px] text-on-surface-variant truncate max-w-[200px]">{e.email}</div> : null}
      </td>
      <td className="px-2 py-2 text-xs text-on-surface-variant">
        {LINK_STATUS_LABEL[e.linkStatus] ?? e.linkStatus}
        {(e.approvedChildren > 0 || e.pendingChildren > 0) && (
          <span className="block text-[10px] mt-0.5">
            {e.approvedChildren > 0 ? `${e.approvedChildren} aprob.` : ''}
            {e.pendingChildren > 0 ? ` · ${e.pendingChildren} pend.` : ''}
          </span>
        )}
      </td>
      <td className="px-2 py-2 text-xs text-on-surface-variant">{e.phoneMasked ?? '—'}</td>
      <td className="px-2 py-2">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-label-caps border ${st.className}`}>
          {st.text}
        </span>
      </td>
      <td className="px-2 py-2 text-xs text-on-surface-variant max-w-[220px]">
        {e.outcome === 'sent' ? (
          <span className="text-green-400/90">Recibió el mensaje</span>
        ) : (
          <span title={e.errorMessage ?? undefined}>{e.skipReasonLabel}</span>
        )}
      </td>
    </tr>
  );
}

function BatchDetailPanel({
  detail,
  onClose,
}: {
  detail: WhatsAppDeliveryBatchDetail;
  onClose: () => void;
}) {
  const { batch, entries } = detail;
  const [filter, setFilter] = useState<'all' | 'sent' | 'skipped' | 'failed'>('all');

  const filtered = entries.filter((e) => filter === 'all' || e.outcome === filter);

  return (
    <div className="rounded-xl border border-primary/25 bg-surface-container/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-label-caps text-[10px] text-primary tracking-wide">{batch.kindLabel}</p>
          <h3 className="font-headline-lg-mobile text-on-surface truncate">{batch.title}</h3>
          <p className="text-xs text-on-surface-variant mt-1">{formatWhen(batch.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg text-on-surface-variant hover:bg-surface-variant"
          aria-label="Cerrar detalle"
        >
          <MaterialIcon name="close" size={20} />
        </button>
      </div>

      {batch.messagePreview ? (
        <p className="text-xs text-on-surface-variant bg-surface-container-high/50 rounded-lg p-2 whitespace-pre-wrap">
          {batch.messagePreview}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/25">
          Enviados: {batch.sentCount}
        </span>
        <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">
          No enviados: {batch.skippedCount}
        </span>
        {batch.failedCount > 0 ? (
          <span className="px-2 py-1 rounded-full bg-error/10 text-error border border-error/25">
            Fallidos: {batch.failedCount}
          </span>
        ) : null}
        <span className="px-2 py-1 rounded-full bg-surface-variant/30 text-on-surface-variant">
          Total padres: {entries.length}
        </span>
      </div>

      <p className="text-xs text-on-surface-variant">
        Lista de <strong className="text-on-surface">todos los padres registrados</strong>: vinculados y sin vínculo.
        «No enviado» indica por qué no recibió este mensaje (no aplica, sin teléfono, sin hijo aprobado, etc.).
      </p>

      <div className="flex flex-wrap gap-1">
        {(['all', 'sent', 'skipped', 'failed'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-label-caps border ${
              filter === f
                ? 'border-primary/50 text-primary bg-primary/10'
                : 'border-outline-variant/30 text-on-surface-variant'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'sent' ? 'Enviados' : f === 'skipped' ? 'No enviados' : 'Fallidos'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto max-h-[min(50dvh,400px)] overflow-y-auto rounded-lg border border-outline-variant/20">
        <table className="w-full min-w-[640px] text-left">
          <thead className="sticky top-0 bg-surface-container-high text-[10px] font-label-caps text-on-surface-variant uppercase">
            <tr>
              <th className="px-2 py-2">Padre/tutor</th>
              <th className="px-2 py-2">Vínculo</th>
              <th className="px-2 py-2">Tel.</th>
              <th className="px-2 py-2">Estado</th>
              <th className="px-2 py-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <EntryRow key={e.id} e={e} />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-on-surface-variant text-center">Sin registros en este filtro.</p>
        ) : null}
      </div>
    </div>
  );
}

function BatchListItem({
  batch,
  selected,
  onSelect,
}: {
  batch: WhatsAppDeliveryBatchSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
        selected
          ? 'border-primary/40 bg-primary/10'
          : 'border-outline-variant/25 hover:border-primary/25 bg-surface-container/20'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-label-caps text-primary">{batch.kindLabel}</span>
        <span className="text-[10px] text-on-surface-variant">{formatWhen(batch.createdAt)}</span>
      </div>
      <p className="text-sm text-on-surface font-medium truncate mt-0.5">{batch.title}</p>
      <p className="text-[11px] text-on-surface-variant mt-1">
        <span className="text-green-400">{batch.sentCount} enviados</span>
        {' · '}
        <span className="text-amber-400">{batch.skippedCount} no enviados</span>
        {batch.failedCount > 0 ? (
          <>
            {' · '}
            <span className="text-error">{batch.failedCount} fallidos</span>
          </>
        ) : null}
      </p>
    </button>
  );
}

export function WhatsAppDeliveryAudit() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const listQ = useQuery({
    queryKey: ['whatsapp-delivery-batches', page],
    queryFn: () => listWhatsAppDeliveryBatches({ page, limit: 15 }),
  });

  const detailQ = useQuery({
    queryKey: ['whatsapp-delivery-batch', selectedId],
    queryFn: () => getWhatsAppDeliveryBatch(selectedId!),
    enabled: Boolean(selectedId),
  });

  const batches = (listQ.data?.data ?? []) as WhatsAppDeliveryBatchSummary[];
  const meta = listQ.data?.meta;

  return (
    <section className="space-y-4 border-t border-outline-variant/20 pt-6">
      <div>
        <h2 className="font-headline-lg-mobile text-on-surface flex items-center gap-2">
          <MaterialIcon name="history" size={22} className="text-primary" />
          Historial de envíos
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Revisa cada campaña: qué padres recibieron WhatsApp y cuáles no, con el motivo (vinculados o sin vínculo).
        </p>
      </div>

      {listQ.isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : batches.length === 0 ? (
        <p className="text-sm text-on-surface-variant rounded-lg border border-outline-variant/20 p-4">
          Aún no hay envíos registrados. Al publicar avisos, resultados o recordatorios CURP aparecerán aquí.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
          <div className="space-y-2 max-h-[min(70dvh,520px)] overflow-y-auto pr-1">
            {batches.map((b) => (
              <BatchListItem
                key={b.id}
                batch={b}
                selected={selectedId === b.id}
                onSelect={() => setSelectedId(b.id)}
              />
            ))}
            {meta && meta.totalPages > 1 ? (
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-[11px] font-label-caps px-2 py-1 rounded border border-outline-variant/30 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-[11px] text-on-surface-variant">
                  {page} / {meta.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-[11px] font-label-caps px-2 py-1 rounded border border-outline-variant/30 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            ) : null}
          </div>

          <div className="min-w-0">
            {!selectedId ? (
              <p className="text-sm text-on-surface-variant p-4 rounded-lg border border-dashed border-outline-variant/30">
                Selecciona un envío de la lista para ver el detalle por padre.
              </p>
            ) : detailQ.isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : detailQ.data?.data ? (
              <BatchDetailPanel detail={detailQ.data.data} onClose={() => setSelectedId(null)} />
            ) : (
              <p className="text-sm text-error p-4">No se pudo cargar el detalle.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
