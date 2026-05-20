import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { AttendanceGrid } from '@/api/attendance';

function monthLabel(period: string): string {
  const [y, m] = period.split('-').map(Number);
  if (!y || !m) return period;
  return new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

function dayColumnTitle(date: string, type: string): string {
  const d = new Date(date + 'T12:00:00');
  const wd = d.toLocaleDateString('es-MX', { weekday: 'short' });
  return `${wd} ${d.getDate()}\n${type === 'match' ? 'Juego' : 'Entreno'}`;
}

/** Genera PDF horizontal del registro de asistencia (uso interno). */
export function downloadAttendancePdf(
  grid: AttendanceGrid,
  records: Record<string, Record<string, boolean>>,
  periodYm: string,
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(15);
  doc.text('F.C. Barcelona Cupido', 14, 14);
  doc.setFontSize(11);
  doc.text('Registro de asistencia — CONFIDENCIAL', 14, 21);
  doc.setFontSize(9);
  doc.text(`Mes: ${monthLabel(periodYm)}`, 14, 27);
  doc.text('Partido: lun, mié, vie, sáb · Entrenamiento: mar, jue', 14, 32);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 37);

  const head = [
    [
      'Jugador',
      '#',
      ...grid.sessionDates.map((sd) => dayColumnTitle(sd.date, sd.type)),
    ],
  ];

  const body = grid.players.map((p) => {
    const name = `${p.last_name}, ${p.first_name}`.trim();
    const byDate = records[p.id] ?? {};
    return [
      name,
      p.jersey_number != null ? String(p.jersey_number) : '—',
      ...grid.sessionDates.map((sd) => (byDate[sd.date] ? '✓' : '—')),
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: 42,
    styles: { fontSize: 7, cellPadding: 1.2 },
    headStyles: { fillColor: [0, 35, 102], fontSize: 6 },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 8, halign: 'center' },
    },
    margin: { left: 10, right: 10 },
  });

  const safeName = periodYm.replace(/[^\d-]/g, '');
  doc.save(`asistencia-barcelona-cupido-${safeName}.pdf`);
}
