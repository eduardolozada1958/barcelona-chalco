import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { getPerformancePublic } from '@/api/performance';
import type { PerformanceEntry, PerformanceReport } from '@/api/performance';
import { MaterialIcon } from '@/components/MaterialIcon';
import { PageSeo } from '@/components/PageSeo';
import { Spinner } from '@/components/Spinner';
import { CLUB_DISPLAY_NAME, CLUB_LOGO_URL } from '@/config/club';
import { CLUB_TIMEZONE } from '@/utils/club-datetime';
import { downloadPerformanceReportPdf } from '@/utils/performance-pdf';

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

function PlayerBlock({ entry }: { entry: PerformanceEntry }) {
  return (
    <article className="border-b border-outline-variant/25 pb-stack-sm last:border-0 last:pb-0">
      <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase tracking-wide mb-3">
        {entry.playerName}
      </h3>
      <div className="space-y-3 font-body-md text-body-md text-on-surface-variant leading-relaxed">
        <div>
          <p className="font-label-caps text-label-caps text-primary mb-1">Avance</p>
          <p className="whitespace-pre-wrap">{entry.advance}</p>
        </div>
        {entry.difficulty?.trim() ? (
          <div>
            <p className="font-label-caps text-label-caps text-secondary mb-1">Dificultad</p>
            <p className="whitespace-pre-wrap">{entry.difficulty}</p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function PublicPerformanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({
    queryKey: ['performance-public', id],
    queryFn: () => getPerformancePublic(id!),
    enabled: Boolean(id),
  });

  if (q.isLoading) return <Spinner />;

  const report = q.data?.data as PerformanceReport | undefined;
  if (!report) {
    return <p className="p-8 text-center text-on-surface-variant">Informe no encontrado.</p>;
  }

  const excerpt = `${report.title} · ${report.entries.length} jugador(es)`;

  return (
    <div className="pt-4 pb-stack-lg px-margin-mobile md:px-margin-desktop max-w-[820px] mx-auto w-full">
      <PageSeo
        title={`${report.title} — Análisis de rendimiento`}
        description={excerpt}
        path={`/rendimiento/${id}`}
        type="article"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-stack-md">
        <Link to="/rendimiento" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          ← Análisis de rendimiento
        </Link>
        <button
          type="button"
          onClick={() => downloadPerformanceReportPdf(report)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 text-primary font-label-caps text-[11px] hover:bg-primary/10 transition-colors"
        >
          <MaterialIcon name="picture_as_pdf" size={18} />
          Descargar PDF
        </button>
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low overflow-hidden shadow-lg">
        <header className="bg-gradient-to-b from-surface-container-high to-surface-container-low px-stack-md py-stack-lg text-center border-b border-outline-variant/25">
          <img
            src={CLUB_LOGO_URL}
            alt={CLUB_DISPLAY_NAME}
            className="h-20 w-20 sm:h-24 sm:w-24 object-contain mx-auto mb-4 drop-shadow-md"
          />
          <p className="font-label-caps text-label-caps text-primary tracking-widest mb-2">{CLUB_DISPLAY_NAME}</p>
          <h1 className="font-display-hero text-2xl sm:text-3xl text-on-surface mb-3">Análisis de rendimiento</h1>
          <p className="font-body-md text-on-surface-variant capitalize mb-2">{formatReportDateLong(report.reportDate)}</p>
          <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{report.title}</p>
        </header>

        <section className="px-stack-md py-stack-lg space-y-stack-md">
          {report.entries.map((entry, i) => (
            <PlayerBlock key={`${entry.playerName}-${i}`} entry={entry} />
          ))}
        </section>
      </div>
    </div>
  );
}
