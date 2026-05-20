import { jsPDF } from 'jspdf';
import autoTable, { type CellHookData } from 'jspdf-autotable';

import type { AttendanceGrid } from '@/api/attendance';
import { formatSessionColumnHeader } from '@/utils/attendance-calendar';

/** Marcadores internos (no Unicode) para dibujar palomita en PDF. */
const PDF_PRESENT = '__PRESENT__';
const PDF_ABSENT = '__ABSENT__';

/** Palomita con fuente ZapfDingbats (incluida en jsPDF; el carácter "4" = check). */
function applyAttendanceCellStyle(data: CellHookData): void {
  if (data.section !== 'body' || data.column.index < 2) return;
  const raw = String(data.cell.raw ?? '');
  if (raw === PDF_PRESENT) {
    data.cell.text = ['4'];
    data.cell.styles.font = 'ZapfDingbats';
    data.cell.styles.fontStyle = 'normal';
    data.cell.styles.halign = 'center';
    data.cell.styles.valign = 'middle';
    data.cell.styles.fontSize = 11;
    data.cell.styles.textColor = [180, 140, 30];
  } else if (raw === PDF_ABSENT) {
    data.cell.text = ['-'];
    data.cell.styles.halign = 'center';
    data.cell.styles.valign = 'middle';
    data.cell.styles.textColor = [120, 120, 120];
  }
}

function monthLabel(period: string): string {
  const [y, m] = period.split('-').map(Number);
  if (!y || !m) return period;
  return new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
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
  doc.text('Registro de asistencia - CONFIDENCIAL', 14, 21);
  doc.setFontSize(9);
  doc.text(`Mes: ${monthLabel(periodYm)}`, 14, 27);
  doc.text('Partido: lun, mié, vie, sáb · Entrenamiento: mar, jue', 14, 32);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 37);

  const head = [
    [
      'Jugador',
      '#',
      ...grid.sessionDates.map((sd) => formatSessionColumnHeader(sd.date, sd.type).lines.join('\n')),
    ],
  ];

  const body = grid.players.map((p) => {
    const name = `${p.last_name}, ${p.first_name}`.trim();
    const byDate = records[p.id] ?? {};
    return [
      name,
      p.jersey_number != null ? String(p.jersey_number) : '-',
      ...grid.sessionDates.map((sd) => (byDate[sd.date] ? PDF_PRESENT : PDF_ABSENT)),
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: 42,
    styles: { fontSize: 7, cellPadding: 1.2, font: 'helvetica' },
    headStyles: { fillColor: [0, 35, 102], fontSize: 6, font: 'helvetica' },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 8, halign: 'center' },
    },
    margin: { left: 10, right: 10 },
    didParseCell: applyAttendanceCellStyle,
  });

  const safeName = periodYm.replace(/[^\d-]/g, '');
  doc.save(`asistencia-barcelona-cupido-${safeName}.pdf`);
}
