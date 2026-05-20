import { jsPDF } from 'jspdf';
import autoTable, { type CellHookData } from 'jspdf-autotable';

import type { FeeMatrixPayload, FeeMatrixRow } from '@/api/fees';

const PDF_PAID = '__PAID__';
const CHECK_COLOR: [number, number, number] = [180, 140, 30];

function getPdfDoc(data: CellHookData): jsPDF {
  const doc = data.doc as jsPDF & { getDocument?: () => jsPDF };
  return typeof doc.getDocument === 'function' ? doc.getDocument() : doc;
}

function preparePaidCell(data: CellHookData): void {
  if (data.section !== 'body' || data.column.index < 2 || data.column.index > 3) return;
  const raw = String(data.cell.raw ?? '');
  if (raw === PDF_PAID) {
    data.cell.text = [];
    data.cell.styles.halign = 'center';
    data.cell.styles.valign = 'middle';
  } else if (raw === 'Pendiente') {
    data.cell.styles.halign = 'center';
    data.cell.styles.textColor = [140, 80, 80];
  }
}

function drawPaidCheck(data: CellHookData): void {
  if (data.section !== 'body' || data.column.index < 2 || data.column.index > 3) return;
  if (String(data.cell.raw ?? '') !== PDF_PAID) return;

  const pdf = getPdfDoc(data);
  const { x, y, width, height } = data.cell;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const s = Math.min(width, height) * 0.2;

  pdf.setDrawColor(...CHECK_COLOR);
  pdf.setLineWidth(0.38);
  pdf.setLineCap('round');
  pdf.setLineJoin('round');
  pdf.line(cx - 1.1 * s, cy + 0.1 * s, cx - 0.26 * s, cy + 0.88 * s);
  pdf.line(cx - 0.26 * s, cy + 0.88 * s, cx + 1.32 * s, cy - 0.92 * s);
}

function monthLabel(periodYm: string): string {
  const [y, m] = periodYm.split('-').map(Number);
  if (!y || !m) return periodYm;
  return new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

function playerName(row: FeeMatrixRow): string {
  return `${row.last_name}, ${row.first_name}`.trim();
}

function parentsCell(row: FeeMatrixRow): string {
  if (row.linked_parents.length === 0) return 'Sin padre vinculado';
  return row.linked_parents
    .map((p) => `${p.email}${p.payment_hold ? ' (bloqueado)' : ' (activo)'}`)
    .join('\n');
}

function buildParentSummaryRows(rows: FeeMatrixRow[]): string[][] {
  const byParent = new Map<
    string,
    { hold: boolean; lines: string[] }
  >();

  for (const row of rows) {
    const kid = `${row.first_name} ${row.last_name}`.trim();
    const num = row.jersey_number != null ? `#${row.jersey_number}` : '';
    const pay = `${row.registration_paid && row.monthly_fee_paid ? 'al día' : 'con mora'} (reg: ${
      row.registration_paid ? 'ok' : 'no'
    }, mes: ${row.monthly_fee_paid ? 'ok' : 'no'})`;

    for (const p of row.linked_parents) {
      const prev = byParent.get(p.email);
      const line = `${kid} ${num} — ${pay}`;
      if (prev) {
        prev.hold = prev.hold || p.payment_hold;
        prev.lines.push(line);
      } else {
        byParent.set(p.email, { hold: p.payment_hold, lines: [line] });
      }
    }
  }

  return [...byParent.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([email, { hold, lines }]) => [
      email,
      hold ? 'Bloqueado' : 'Activo',
      lines.join('\n'),
    ]);
}

/** PDF confidencial: cuotas por jugador y resumen por padre. */
export function downloadFeesPdf(payload: FeeMatrixPayload, periodYm: string): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const rows = payload.rows;
  const mora = rows.filter((r) => !r.registration_paid || !r.monthly_fee_paid).length;

  doc.setFontSize(15);
  doc.text('F.C. Barcelona Cupido', 14, 14);
  doc.setFontSize(11);
  doc.text('Cuotas y padres - CONFIDENCIAL', 14, 21);
  doc.setFontSize(9);
  doc.text(`Mes: ${monthLabel(periodYm)}`, 14, 27);
  doc.text(`Jugadores con mora: ${mora} / ${rows.length}`, 14, 32);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 37);

  const playerBody = rows.map((row) => [
    playerName(row),
    row.jersey_number != null ? String(row.jersey_number) : '-',
    row.registration_paid ? PDF_PAID : 'Pendiente',
    row.monthly_fee_paid ? PDF_PAID : 'Pendiente',
    parentsCell(row),
  ]);

  autoTable(doc, {
    head: [['Jugador', '#', 'Registro', 'Mensualidad', 'Padres (acceso)']],
    body: playerBody,
    startY: 42,
    styles: { fontSize: 7, cellPadding: 1.4, font: 'helvetica', overflow: 'linebreak' },
    headStyles: { fillColor: [0, 35, 102], fontSize: 7, font: 'helvetica' },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 8, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 'auto' },
    },
    margin: { left: 10, right: 10 },
    didParseCell: preparePaidCell,
    didDrawCell: drawPaidCheck,
  });

  const parentRows = buildParentSummaryRows(rows);
  if (parentRows.length > 0) {
    const afterPlayers = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 42;
    doc.setFontSize(10);
    doc.text('Resumen por padre', 14, afterPlayers + 10);

    autoTable(doc, {
      head: [['Correo del padre', 'Acceso', 'Hijos y pagos']],
      body: parentRows,
      startY: afterPlayers + 14,
      styles: { fontSize: 7, cellPadding: 1.4, font: 'helvetica', overflow: 'linebreak' },
      headStyles: { fillColor: [60, 60, 90], fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 52 },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 'auto' },
      },
      margin: { left: 10, right: 10 },
    });
  }

  const safeName = periodYm.replace(/[^\d-]/g, '');
  doc.save(`cuotas-padres-barcelona-cupido-${safeName}.pdf`);
}
