import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { getAttendanceGrid, saveAttendance, type AttendanceGrid } from '@/api/attendance';
import { AdminPrivateNotice } from '@/components/AdminPrivateNotice';
import { MaterialIcon } from '@/components/MaterialIcon';
import { Spinner } from '@/components/Spinner';
import { downloadAttendancePdf } from '@/utils/attendance-pdf';

function formatDayHeader(date: string, type: string): string {
  const d = new Date(date + 'T12:00:00');
  const wd = d.toLocaleDateString('es-MX', { weekday: 'short' });
  const day = d.getDate();
  return `${wd} ${day}\n${type === 'match' ? 'Juego' : 'Entreno'}`;
}

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
        for (const sd of grid.sessionDates) {
          records.push({
            playerId: player.id,
            date:     sd.date,
            present:  Boolean(byDate[sd.date]),
          });
        }
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
    <div className="space-y-6">
      <div>
        <h1 className="font-headline-lg text-2xl text-on-surface">Registro de asistencia</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Marca asistencia por día. Los domingos no tienen sesión.
        </p>
        {legend}
      </div>

      <AdminPrivateNotice>
        El registro de asistencia no se publica en la web. Cada padre solo ve sus propios avisos en el panel;
        aquí controlas la plantilla completa del club.
      </AdminPrivateNotice>

      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="font-label-caps text-[10px] text-on-surface-variant block mb-1">Mes</label>
          <input
            type="month"
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
        <button
          type="button"
          disabled={!dirty || saveMut.isPending}
          onClick={() => saveMut.mutate()}
          className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-caps text-sm disabled:opacity-50"
        >
          {saveMut.isPending ? 'Guardando…' : 'Guardar asistencia'}
        </button>
        <button
          type="button"
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant/40 text-sm hover:border-primary"
        >
          <MaterialIcon name="picture_as_pdf" size={18} />
          Exportar PDF
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/25 max-h-[70vh]">
        <table className="text-xs border-collapse min-w-max">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-20 bg-surface-container px-2 py-2 text-left font-label-caps min-w-[140px]">
                Jugador
              </th>
              {grid.sessionDates.map((sd) => (
                <th
                  key={sd.date}
                  className={`px-1 py-2 text-center font-label-caps whitespace-pre leading-tight min-w-[52px] ${
                    sd.type === 'match' ? 'bg-emerald-900/50 text-emerald-100' : 'bg-sky-900/50 text-sky-100'
                  }`}
                >
                  {formatDayHeader(sd.date, sd.type)}
                </th>
              ))}
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
                          className={`w-8 h-8 rounded border transition-colors ${
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
      </div>
    </div>
  );
}
