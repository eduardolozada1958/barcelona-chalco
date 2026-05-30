import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  createPerformanceReport,
  deletePerformanceReport,
  listPerformanceAdmin,
  publishPerformanceReport,
  updatePerformanceReport,
  type CreatePerformanceReportBody,
  type PerformanceEntry,
  type PerformanceReport,
} from '@/api/performance';
import { listPlayersAdmin } from '@/api/players';
import { DashboardModal, formActionsClass, formInputClass, formLabelClass } from '@/components/DashboardModal';
import { DashboardRowActions } from '@/components/DashboardRowActions';
import {
  DashboardPageHeader,
  DashboardPageShell,
  DashboardPrimaryButton,
  DashboardTableFrame,
} from '@/components/dashboard/DashboardUi';
import { MaterialIcon } from '@/components/MaterialIcon';
import { Spinner } from '@/components/Spinner';
import { formatMatchDateClub } from '@/utils/club-datetime';
import { downloadPerformanceReportPdf } from '@/utils/performance-pdf';
import { getApiErrorMessage } from '@utils/api-error';

const EMPTY_ENTRY: PerformanceEntry = { playerName: '', advance: '', difficulty: '', playerId: null };

function playerDisplayName(p: Record<string, unknown>): string {
  return `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || String(p.id ?? '');
}

function todayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function DashboardPerformancePage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<PerformanceReport | null>(null);
  const [title, setTitle] = useState('');
  const [reportDate, setReportDate] = useState(todayIsoDate());
  const [entries, setEntries] = useState<PerformanceEntry[]>([{ ...EMPTY_ENTRY }]);

  const q = useQuery({
    queryKey: ['performance-admin'],
    queryFn: () => listPerformanceAdmin({ page: 1, limit: 50 }),
  });

  const playersQ = useQuery({
    queryKey: ['players-admin', 'performance-report'],
    queryFn: () => listPlayersAdmin({ page: 1, limit: 200, status: 'active' }),
    enabled: modalOpen,
  });

  const rosterPlayers = useMemo(() => {
    const rows = (playersQ.data?.data ?? []) as Record<string, unknown>[];
    return [...rows].sort((a, b) => {
      const la = String(a.last_name ?? '');
      const lb = String(b.last_name ?? '');
      if (la !== lb) return la.localeCompare(lb, 'es');
      return String(a.first_name ?? '').localeCompare(String(b.first_name ?? ''), 'es');
    });
  }, [playersQ.data]);

  const rows = (q.data?.data ?? []) as PerformanceReport[];

  const resetForm = () => {
    setTitle('');
    setReportDate(todayIsoDate());
    setEntries([{ ...EMPTY_ENTRY }]);
    setEditRow(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (row: PerformanceReport) => {
    setEditRow(row);
    setTitle(row.title);
    setReportDate(row.reportDate);
    setEntries(row.entries.length ? row.entries.map((e) => ({ ...e })) : [{ ...EMPTY_ENTRY }]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const saveMut = useMutation({
    mutationFn: async (publishAfter: boolean) => {
      const body: CreatePerformanceReportBody = {
        title: title.trim(),
        category: 'General',
        reportDate,
        entries: entries
          .map((e) => ({
            playerName: e.playerName.trim(),
            playerId: e.playerId ?? null,
            advance: e.advance.trim(),
            difficulty: e.difficulty?.trim() ?? '',
          }))
          .filter((e) => e.playerName && e.advance),
      };
      if (body.entries.length === 0) throw new Error('Agrega al menos un jugador con avance');
      if (!body.title) throw new Error('El título es obligatorio');
      if (entries.some((e) => e.advance.trim() && !e.playerName.trim())) {
        throw new Error('Selecciona un jugador de la plantilla para cada fila con avance');
      }

      if (editRow) {
        const res = await updatePerformanceReport(editRow.id, body);
        if (publishAfter && !editRow.isPublished) {
          await publishPerformanceReport(editRow.id, true);
        }
        return res;
      }
      const res = await createPerformanceReport(body);
      const created = res.data as PerformanceReport;
      if (publishAfter) await publishPerformanceReport(created.id, true);
      return res;
    },
    onSuccess: (_res, publishAfter) => {
      toast.success(publishAfter ? 'Informe publicado' : 'Informe guardado');
      void qc.invalidateQueries({ queryKey: ['performance-admin'] });
      void qc.invalidateQueries({ queryKey: ['performance-public'] });
      closeModal();
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e)),
  });

  const publishMut = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) => publishPerformanceReport(id, publish),
    onSuccess: (_res, vars) => {
      toast.success(vars.publish ? 'Publicado' : 'Despublicado');
      void qc.invalidateQueries({ queryKey: ['performance-admin'] });
      void qc.invalidateQueries({ queryKey: ['performance-public'] });
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePerformanceReport(id),
    onSuccess: () => {
      toast.success('Informe eliminado');
      void qc.invalidateQueries({ queryKey: ['performance-admin'] });
      void qc.invalidateQueries({ queryKey: ['performance-public'] });
    },
    onError: (e: Error) => toast.error(getApiErrorMessage(e)),
  });

  useEffect(() => {
    if (!modalOpen) resetForm();
  }, [modalOpen]);

  if (q.isLoading) return <Spinner />;

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="📊 Análisis de rendimiento"
        actions={
          <DashboardPrimaryButton onClick={openCreate}>
            ➕ Nuevo informe
          </DashboardPrimaryButton>
        }
      />

      <p className="text-sm text-on-surface-variant max-w-2xl">
        Crea informes con avance y dificultad por jugador. Al publicar, aparecen en{' '}
        <Link to="/rendimiento" className="text-primary hover:underline" target="_blank" rel="noreferrer">
          /rendimiento
        </Link>{' '}
        y puedes exportarlos en PDF con el logo de F.C. Barcelona Cupido.
      </p>

      <DashboardTableFrame>
        <table className="min-w-full text-left text-sm w-full">
          <thead className="bg-surface-container border-b border-outline-variant/20">
            <tr>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Informe</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Fecha</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Estado</th>
              <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-on-surface-variant">
                  No hay informes. Crea el primero con el botón de arriba.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-outline-variant/10 hover:bg-surface-container/50">
                  <td className="p-4">
                    <p className="font-medium text-on-surface">{row.title}</p>
                    <p className="text-xs text-on-surface-variant">{row.entries.length} jugador(es)</p>
                  </td>
                  <td className="p-4 text-on-surface-variant">{formatMatchDateClub(row.reportDate)}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-label-caps ${
                        row.isPublished ? 'bg-primary/15 text-primary' : 'bg-surface-variant text-on-surface-variant'
                      }`}
                    >
                      {row.isPublished ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td className="p-4">
                    <DashboardRowActions
                      onEdit={() => openEdit(row)}
                      showPublish={!row.isPublished}
                      isPublished={row.isPublished}
                      onPublish={() => publishMut.mutate({ id: row.id, publish: true })}
                      publishPending={publishMut.isPending}
                      onDelete={() => {
                        if (window.confirm('¿Eliminar este informe?')) deleteMut.mutate(row.id);
                      }}
                      deletePending={deleteMut.isPending}
                    />
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => downloadPerformanceReportPdf(row)}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        <MaterialIcon name="picture_as_pdf" size={14} />
                        PDF
                      </button>
                      {row.isPublished ? (
                        <>
                          <Link
                            to={`/rendimiento/${row.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-primary hover:underline"
                          >
                            Ver público ↗
                          </Link>
                          <button
                            type="button"
                            onClick={() => publishMut.mutate({ id: row.id, publish: false })}
                            className="text-[11px] text-on-surface-variant hover:text-secondary"
                          >
                            Despublicar
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DashboardTableFrame>

      <DashboardModal open={modalOpen} onClose={closeModal} title={editRow ? 'Editar informe' : 'Nuevo informe'}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className={formLabelClass}>Título del informe</label>
            <input
              className={formInputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Análisis Sub-11 — mayo 2026"
            />
          </div>
          <div>
            <label className={formLabelClass}>Fecha del informe</label>
            <input type="date" className={formInputClass} value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={formLabelClass}>Jugadores</label>
              <button
                type="button"
                onClick={() => setEntries((prev) => [...prev, { ...EMPTY_ENTRY }])}
                className="text-xs text-primary hover:underline"
              >
                + Agregar jugador
              </button>
            </div>
            <div className="space-y-4">
              {playersQ.isLoading ? (
                <p className="text-xs text-on-surface-variant">Cargando plantilla…</p>
              ) : rosterPlayers.length === 0 ? (
                <p className="text-xs text-on-surface-variant">
                  No hay jugadores activos en Plantilla.{' '}
                  <Link to="/dashboard/players" className="text-primary hover:underline">
                    Agregar jugadores
                  </Link>
                </p>
              ) : null}
              {entries.map((entry, idx) => {
                const selectedElsewhere = new Set(
                  entries.flatMap((e, i) => {
                    if (i === idx) return [];
                    if (e.playerId) return [String(e.playerId)];
                    const match = rosterPlayers.find((p) => playerDisplayName(p) === e.playerName.trim());
                    return match ? [String(match.id)] : [];
                  }),
                );
                const matchedPlayer = rosterPlayers.find(
                  (p) =>
                    (entry.playerId && String(p.id) === String(entry.playerId)) ||
                    playerDisplayName(p) === entry.playerName.trim(),
                );
                const selectedId = matchedPlayer ? String(matchedPlayer.id) : '';
                const legacyName =
                  entry.playerName.trim() && !matchedPlayer ? entry.playerName.trim() : '';

                return (
                <div key={idx} className="rounded-lg border border-outline-variant/25 p-3 space-y-2 bg-surface-container/30">
                  <div className="flex gap-2 items-start">
                    <select
                      className={formInputClass}
                      value={selectedId || (legacyName ? '__legacy__' : '')}
                      onChange={(e) => {
                        const id = e.target.value;
                        const player = rosterPlayers.find((p) => String(p.id) === id);
                        const next = [...entries];
                        next[idx] = {
                          ...next[idx],
                          playerId: player ? String(player.id) : null,
                          playerName: player ? playerDisplayName(player) : '',
                        };
                        setEntries(next);
                      }}
                    >
                      <option value="">Selecciona un jugador…</option>
                      {legacyName ? (
                        <option value="__legacy__">{legacyName} (nombre guardado)</option>
                      ) : null}
                      {rosterPlayers.map((p) => {
                        const id = String(p.id);
                        const disabled = selectedElsewhere.has(id);
                        const jersey = p.jersey_number != null ? `#${p.jersey_number} · ` : '';
                        return (
                          <option key={id} value={id} disabled={disabled}>
                            {jersey}
                            {playerDisplayName(p)}
                            {disabled ? ' (ya agregado)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {entries.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setEntries((prev) => prev.filter((_, i) => i !== idx))}
                        className="shrink-0 p-2 text-error hover:bg-error/10 rounded-lg"
                        aria-label="Quitar jugador"
                      >
                        <MaterialIcon name="close" size={18} />
                      </button>
                    ) : null}
                  </div>
                  <textarea
                    className={`${formInputClass} min-h-[72px]`}
                    value={entry.advance}
                    onChange={(e) => {
                      const next = [...entries];
                      next[idx] = { ...next[idx], advance: e.target.value };
                      setEntries(next);
                    }}
                    placeholder="Avance (fortalezas, progreso…)"
                  />
                  <textarea
                    className={`${formInputClass} min-h-[56px]`}
                    value={entry.difficulty ?? ''}
                    onChange={(e) => {
                      const next = [...entries];
                      next[idx] = { ...next[idx], difficulty: e.target.value };
                      setEntries(next);
                    }}
                    placeholder="Dificultad (opcional)"
                  />
                </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={formActionsClass}>
          <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant">
            Cancelar
          </button>
          <button
            type="button"
            disabled={saveMut.isPending}
            onClick={() => saveMut.mutate(false)}
            className="px-4 py-2 rounded-lg border border-primary/40 text-primary disabled:opacity-50"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            disabled={saveMut.isPending}
            onClick={() => saveMut.mutate(true)}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary disabled:opacity-50"
          >
            {editRow?.isPublished ? 'Guardar y mantener publicado' : 'Publicar'}
          </button>
        </div>
      </DashboardModal>
    </DashboardPageShell>
  );
}
