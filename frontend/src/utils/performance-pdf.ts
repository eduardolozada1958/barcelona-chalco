import { jsPDF } from 'jspdf';

import type { PerformanceReport } from '@/api/performance';
import { CLUB_DISPLAY_NAME } from '@/config/club';
import { CLUB_TIMEZONE } from '@/utils/club-datetime';

function formatReportDateLong(iso: string): string {
  try {
    return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', {
      timeZone: CLUB_TIMEZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function safeFilename(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '') || 'informe';
}

/** PDF del análisis de rendimiento (marca F.C. Barcelona Cupido). */
export function downloadPerformanceReportPdf(report: PerformanceReport): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 22;

  const addPageIfNeeded = (needed: number) => {
    const pageH = doc.internal.pageSize.getHeight();
    if (y + needed > pageH - 16) {
      doc.addPage();
      y = 22;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(180, 140, 30);
  doc.text(CLUB_DISPLAY_NAME, pageW / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text('Análisis de rendimiento', pageW / 2, y, { align: 'center' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(formatReportDateLong(report.reportDate), pageW / 2, y, { align: 'center' });
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  const titleLines = doc.splitTextToSize(report.title, contentW);
  titleLines.forEach((line: string) => {
    addPageIfNeeded(6);
    doc.text(line, pageW / 2, y, { align: 'center' });
    y += 6;
  });
  y += 4;

  doc.setDrawColor(180, 140, 30);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  for (const entry of report.entries) {
    addPageIfNeeded(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(entry.playerName.toUpperCase(), margin, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 140, 30);
    doc.text('Avance', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 55, 55);
    const advanceLines = doc.splitTextToSize(entry.advance, contentW);
    advanceLines.forEach((line: string) => {
      addPageIfNeeded(5);
      doc.text(line, margin, y);
      y += 5;
    });
    y += 2;

    if (entry.difficulty?.trim()) {
      addPageIfNeeded(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(120, 90, 20);
      doc.text('Dificultad', margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(55, 55, 55);
      const diffLines = doc.splitTextToSize(entry.difficulty, contentW);
      diffLines.forEach((line: string) => {
        addPageIfNeeded(5);
        doc.text(line, margin, y);
        y += 5;
      });
    }

    y += 8;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageW - margin, y);
    y += 8;
  }

  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  const footer = `Generado ${new Date().toLocaleString('es-MX')} · ${CLUB_DISPLAY_NAME}`;
  doc.text(footer, pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  doc.save(`rendimiento-${safeFilename(report.title)}.pdf`);
}
