import { VenueLeadersSection } from '@/components/VenueLeadersSection';

export function PublicGoleoPage() {
  return (
    <div className="px-margin-mobile md:px-margin-desktop py-stack-lg max-w-[1280px] mx-auto">
      <VenueLeadersSection variant="public" linkPlayerNames={false} limit={15} />
    </div>
  );
}
