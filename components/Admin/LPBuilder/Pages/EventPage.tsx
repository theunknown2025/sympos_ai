import React from 'react';
import type { ConferenceConfig, Event } from '../../../../types';
import LandingPageHeader, {
  type LandingPageNavSection,
  type LandingPageView,
} from './LandingPageHeader';
import LandingPageFooter from './LandingPageFooter';
import EventPageContent from './EventPageContent';

export interface EventPageProps {
  event: Event;
  config: ConferenceConfig;
  homeLabel: string;
  aboutLabel: string;
  onNavigateHome: () => void;
  onNavigateAbout?: () => void;
  onSectionClick?: (sectionId: string) => void;
  sections?: LandingPageNavSection[];
  compact?: boolean;
}

/**
 * Full About/event view inside the landing page shell
 * (same header/footer as the LP preview — not SymposAI `/e` layout).
 */
const EventPage: React.FC<EventPageProps> = ({
  event,
  config,
  homeLabel,
  aboutLabel,
  onNavigateHome,
  onNavigateAbout,
  onSectionClick,
  sections,
  compact = false,
}) => {
  const activeView: LandingPageView = 'about';
  const navSections =
    sections ??
    (config.sections || [])
      .filter((s) => s.isVisible && s.type !== 'hero')
      .map((s) => ({ id: s.id, title: s.title }));

  return (
    <div className="min-h-full bg-white flex flex-col">
      <LandingPageHeader
        config={config}
        activeView={activeView}
        homeLabel={homeLabel}
        aboutLabel={aboutLabel}
        showAbout
        sections={navSections}
        onNavigateHome={onNavigateHome}
        onNavigateAbout={onNavigateAbout}
        onSectionClick={onSectionClick}
        compact={compact}
      />
      <div className="flex-1 bg-slate-50/40">
        <EventPageContent
          event={event}
          homeLabel={homeLabel}
          onNavigateHome={onNavigateHome}
        />
      </div>
      <LandingPageFooter title={config.title || event.name} compact={compact} />
    </div>
  );
};

export default EventPage;
