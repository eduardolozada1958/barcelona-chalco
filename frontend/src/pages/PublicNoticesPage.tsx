import { useQuery } from '@tanstack/react-query';

import { listNoticesPublic } from '@/api/notices';
import type { Notice } from '@/types';
import { NoticeCard } from '@/components/NoticeCard';
import { MaterialIcon } from '@/components/MaterialIcon';
import { SkeletonGrid } from '@/components/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/PageTransition';

const categories = [
  { icon: 'emergency',      label: 'Urgente',        type: 'urgent' },
  { icon: 'sports_soccer',  label: 'Partidos',       type: 'match' },
  { icon: 'fitness_center', label: 'Entrenamiento',  type: 'training' },
  { icon: 'event',          label: 'Eventos',        type: 'event' },
  { icon: 'assignment',     label: 'Administrativo', type: 'administrative' },
  { icon: 'campaign',       label: 'General',        type: 'general' },
];

/**
 * Public notices page – faithful translation of `avisosoficiales.html` mockup.
 * Features: sidebar with categories, notice feed with typed cards.
 */
export function PublicNoticesPage() {
  const q = useQuery({ queryKey: ['notices-public'], queryFn: () => listNoticesPublic() });
  const notices = (q.data?.data ?? []) as Notice[];

  return (
    <div className="pt-4 pb-stack-lg px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto w-full">
      {/* Header */}
      <header className="mb-stack-lg border-b border-outline-variant/30 pb-stack-sm">
        <h1 className="font-display-hero text-display-hero text-primary mb-base">Avisos Oficiales</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Anuncios importantes, horarios y actualizaciones del club.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Sidebar — appears after feed on mobile */}
        <aside className="order-2 md:order-1 col-span-1 md:col-span-3">
          <div className="bg-surface-container-low rounded-xl p-stack-sm border border-outline-variant/20 md:sticky md:top-28">
            <h2 className="font-label-caps text-label-caps text-on-surface mb-stack-sm pb-base border-b border-outline-variant/30">
              Categorías
            </h2>
            <ul className="space-y-base font-body-md text-body-md">
              {categories.map((cat, i) => (
                <li key={cat.type}>
                  <button
                    className={`w-full text-left flex items-center gap-2 transition-colors ${
                      i === 0 ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <MaterialIcon name={cat.icon} size={16} />
                    {cat.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Feed */}
        <section className="order-1 md:order-2 col-span-1 md:col-span-9 space-y-stack-md">
          {q.isLoading ? (
            <SkeletonGrid count={4} />
          ) : notices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-stack-lg text-center">
              <MaterialIcon name="notifications_off" className="text-on-surface-variant mb-4" size={64} />
              <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Sin avisos</p>
              <p className="font-body-md text-on-surface-variant">No hay avisos publicados actualmente.</p>
            </div>
          ) : (
            <StaggerContainer className="space-y-stack-md">
              {notices.map((notice) => (
                <StaggerItem key={notice.id}>
                  <NoticeCard notice={notice} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </section>
      </div>
    </div>
  );
}
