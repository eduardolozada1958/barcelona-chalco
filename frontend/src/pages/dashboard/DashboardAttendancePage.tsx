import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { getAttendanceGrid, saveAttendance, type AttendanceGrid } from '@/api/attendance';
import { AdminPrivateNotice } from '@/components/AdminPrivateNotice';
import {
  DashboardField,
  DashboardMonthInput,
  DashboardPageHeader,
  DashboardPageShell,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
  DashboardTableFrame,
  DashboardToolbar,
} from '@/components/dashboard/DashboardUi';
import { MaterialIcon } from '@/components/MaterialIcon';
import { Spinner } from '@/components/Spinner';
import { downloadAttendancePdf } from '@/utils/attendance-pdf';
import { formatSessionColumnHeader } from '@/utils/attendance-calendar';

export function DashboardAttendancePage() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [local, setLocal] = useState<Record<string, Record<string, boolean>>>({});
  const [dirty, setDirty] = useState(false);

  const q = useQuery({
    queryKey: ['attendance-grid', period],
    queryFn: () => getAttendanceGrid(`${period}-01`),
  });

  const grid = q.data?.data as AttendanceGrid | undefined;

  useEffect(() => {
    if (grid?.records) {
      setLocal(JSON.parse(JSON.stringify(grid.records)) as Record<string, Record<string, boolean>>);
      setDirty(false);
    }
  }, [grid?.periodMonth, grid?.records]);

  const saveMut = useMutation({
    mutationFn: () => {
      if (!grid) throw new Error('Sin datos');
      const records: { playerId: string; date: string; present: boolean }[] = [];
      for (const player of grid.players) {
        const byDate = local[player.id] ?? {};
        const saved = grid.records[player.id] ?? {};
        for (const sd of grid.sessionDates) {
          const present = Boolean(byDate[sd.date]);
          const wasPresent = Boolean(saved[sd.date]);
          if (present === wasPresent) continue;
          records.push({
            playerId: player.id,
            date:     sd.date,
            present,
          });
        }
      }
      if (records.length === 0) {
        throw new Error('No hay cambios que guardar');
      }
      return saveAttendance({ periodMonth: grid.periodMonth, records });
    },
    onSuccess: () => {
      toast.success('Asistencia guardada');
      setDirty(false);
      void qc.invalidateQueries({ queryKey: ['attendance-grid'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const legend = useMemo(
    () => (
      <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
        <span>
          <span className="inline-block w-3 h-3 rounded bg-emerald-600/80 mr-1" />
          Partido: lun, mié, vie, sáb
        </span>
        <span>
          <span className="inline-block w-3 h-3 rounded bg-sky-600/80 mr-1" />
          Entrenamiento: mar, jue
        </span>
      </div>
    ),
    [],
  );

  if (q.isLoading) return <Spinner />;
  if (!grid) return <p className="text-on-surface-variant">No se pudo cargar la asistencia.</p>;

  const toggle = (playerId: string, date: string) => {
    setLocal((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] ?? {}),
        [date]: !prev[playerId]?.[date],
      },
    }));
    setDirty(true);
  };

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Registro de asistencia"
        description="Las fechas del mes se calculan solas: partido lun, mié, vie y sáb; entreno mar y jue."
      />
      <div className="mt-1">{legend}</div>

      <AdminPrivateNotice>
        El registro de asistencia no se publica en la web. Cada padre solo ve sus propios avisos en el panel;
        aquí controlas la plantilla completa del club.
      </AdminPrivateNotice>

      <DashboardToolbar>
        <DashboardField label="Mes">
          <DashboardMonthInput value={period} onChange={(e) => setPeriod(e.target.value)} />
        </DashboardField>
        <DashboardPrimaryButton
          disabled={!dirty || saveMut.isPending}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending ? 'Guardando…' : 'Guardar asistencia'}
        </DashboardPrimaryButton>
        <DashboardSecondaryButton
          onClick={() => {
            if (dirty) {
              toast.error('Guarda los cambios antes de exportar el PDF');
              return;
            }
            try {
              downloadAttendancePdf(grid, local, period);
              toast.success('PDF descargado');
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'No se pudo generar el PDF');
            }
          }}
        >
          <MaterialIcon name="picture_as_pdf" size={18} />
          Exportar PDF
        </DashboardSecondaryButton>
      </DashboardToolbar>

      <DashboardTableFrame maxHeight="70vh">
        <table className="text-xs border-collapse min-w-max w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-20 bg-surface-container px-2 py-2 text-left font-label-caps min-w-[140px]">
                Jugador
              </th>
              {grid.sessionDates.map((sd) => {
                const h = formatSessionColumnHeader(sd.date, sd.type);
                return (
                  <th
                    key={sd.date}
                    title={h.title}
                    className={`px-1 py-2 text-center text-[10px] leading-tight min-w-[72px] max-w-[88px] ${
                      sd.type === 'match' ? 'bg-emerald-900/50 text-emerald-100' : 'bg-sky-900/50 text-sky-100'
                    }`}
                  >
                    {h.lines.map((line, i) => (
                      <span key={i} className={`block ${i === 0 ? 'font-semibold capitalize' : ''}`}>
                        {line}
                      </span>
                    ))}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {grid.players.map((p) => {
              const name = `${p.first_name} ${p.last_name}`.trim();
              return (
                <tr key={p.id} className="border-t border-outline-variant/10">
                  <td className="sticky left-0 z-10 bg-surface-container/95 px-2 py-1.5 font-medium text-on-surface">
                    {name}
                    {p.jersey_number != null ? (
                      <span className="text-on-surface-variant ml-1">#{p.jersey_number}</span>
                    ) : null}
                  </td>
                  {grid.sessionDates.map((sd) => {
                    const on = Boolean(local[p.id]?.[sd.date]);
                    return (
                      <td key={sd.date} className="px-1 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => toggle(p.id, sd.date)}
                          className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg border transition-colors touch-manipulation ${
                            on
                              ? 'bg-primary/30 border-primary text-primary'
                              : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant/40'
                          }`}
                          title={on ? 'Asistió' : 'Falta'}
                        >
                          {on ? '✓' : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </DashboardTableFrame>
    </DashboardPageShell>
  );
}
