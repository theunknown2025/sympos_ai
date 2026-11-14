import React, { useState } from 'react';
import { ConferenceConfig, Event } from '../../../../types';
import { X, Calendar, MapPin } from 'lucide-react';
import type { AboutDesignId } from '../../../../types';
import FormModal from '../../Tools/FormBuilder/FormModal';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';
import { useAdminDisplaySettings } from '../../../../contexts/AdminDisplaySettingsContext';

// Import all preview sections
import FaqSection from '../Sections/FaqSection';
import EventTopicsSection from '../Sections/EventTopicsSection';
import ScientificCommitteeSection from '../Sections/ScientificCommitteeSection';
import ContactSection from '../Sections/ContactSection';
import SubmissionSection from '../Sections/SubmissionSection';
import PartnersSection from '../Sections/PartnersSection';
import PricingSection from '../Sections/PricingSection';
import AgendaSection from '../Sections/AgendaSection';
import SpeakersSection from '../Sections/SpeakersSection';
import TeamSection from '../Sections/TeamSection';
import ImagesSection from '../Sections/ImagesSection';
import AboutSection from '../Sections/AboutSection';
import SectionActionButtonWrap from '../Sections/SectionActionButtonWrap';
import { useLandingPageActionHandler } from '../shared/useLandingPageActionHandler';
import { resolveScientificCommittee } from '../../../../utils/scientificCommitteeUtils';
import { EventPage, LandingPageHeader, LandingPageFooter } from '../Pages';
import type { LandingPageView } from '../Pages';

interface FullScreenPreviewProps {
  config: ConferenceConfig;
  activePreviewDay: string;
  onDayChange: (dayId: string) => void;
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  onClose: () => void;
  pageId?: string;
  linkedEvent?: Event | null;
  homeLabel?: string;
  aboutNavLabel?: string;
  onAboutDesignChange?: (design: AboutDesignId) => void;
}

const FullScreenPreview: React.FC<FullScreenPreviewProps> = ({
  config,
  activePreviewDay,
  onDayChange,
  timeLeft,
  onClose,
  pageId,
  linkedEvent = null,
  homeLabel = 'Home',
  aboutNavLabel = 'About',
  onAboutDesignChange,
}) => {
  const { t } = useAdminTranslation('pageBuilder');
  const landingPageActions = useLandingPageActionHandler({
    evaluationUnavailable: t('edSecActionEvaluationUnavailable'),
  });
  const { language } = useAdminDisplaySettings();
  const localeTag = language === 'fr' ? 'fr-FR' : 'en-US';
  const [activeView, setActiveView] = useState<LandingPageView>('home');
  const showAbout = Boolean(linkedEvent);

  const visibleNavSections = config.sections
    .filter((s) => s.isVisible && s.type !== 'hero')
    .map((s) => ({ id: s.id, title: s.title }));

  const renderPreviewSection = (section: any) => {
    if (!section.isVisible) return null;

    const wrapSectionPreview = (node: React.ReactNode) => {
      if (section.type === 'hero') return node;
      return (
        <SectionActionButtonWrap
          key={section.id}
          section={section}
          onActionClick={landingPageActions.handleActionClick}
        >
          {node}
        </SectionActionButtonWrap>
      );
    };

    switch (section.type) {
      case 'hero':
        return (
          <div key={section.id} className={`relative min-h-[600px] flex flex-col justify-center px-20 ${config.hero.layout === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
            <div className="absolute inset-0 z-0">
              <img src={config.hero.backgroundImage} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-slate-900" style={{ opacity: config.hero.overlayOpacity / 100 }}></div>
            </div>
            <div className="relative z-10 animate-fade-in-up">
              <h1 className="text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">{config.title}</h1>
              {config.hero.tagline && <p className="text-xl text-slate-200 mb-8 max-w-2xl font-light">{config.hero.tagline}</p>}
              
              {(config.hero.showDate || config.hero.showLocation) && (
                <div className={`flex gap-6 mb-8 ${config.hero.layout === 'center' ? 'justify-center' : 'justify-start'}`}>
                  {config.hero.showDate && config.date && (
                    <div className="flex items-center gap-2 text-white/90">
                      <Calendar size={20} className="text-indigo-300" />
                      <span className="text-lg font-medium">
                        {new Date(config.date).toLocaleDateString(localeTag, { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                  {config.hero.showLocation && config.location && (
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin size={20} className="text-indigo-300" />
                      <span className="text-lg font-medium">{config.location}</span>
                    </div>
                  )}
                </div>
              )}
              
              {config.hero.showTimer && (
                <div className={`flex gap-4 mb-10 ${config.hero.layout === 'center' ? 'justify-center' : 'justify-start'}`}>
                  {[
                    { label: t('previewCountdownDays'), value: timeLeft.days },
                    { label: t('previewCountdownHours'), value: timeLeft.hours },
                    { label: t('previewCountdownMin'), value: timeLeft.minutes },
                    { label: t('previewCountdownSec'), value: timeLeft.seconds }
                  ].map((unit, i) => (
                    <div key={i} className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-xl p-3 min-w-[70px] border border-white/20 shadow-xl">
                      <span className="text-2xl font-bold text-white font-mono">{String(unit.value).padStart(2, '0')}</span>
                      <span className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold mt-1">{unit.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 justify-center">
                {config.hero.buttons.map(b => (
                  <button 
                    key={b.id} 
                    onClick={() => landingPageActions.handleActionClick(b)}
                    className={`px-8 py-3 rounded-full font-bold transition-all transform hover:-translate-y-0.5 ${b.style === 'primary' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500' : 'bg-white/10 text-white border border-white/30 backdrop-blur-md hover:bg-white/20'}`}
                  >
                    {b.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'about':
        return wrapSectionPreview(
          <AboutSection
            title={section.title}
            description={config.description}
            titleAlignment={section.titleAlignment || 'center'}
            aboutConfig={config.about}
            showDesignPicker={Boolean(onAboutDesignChange)}
            onDesignChange={onAboutDesignChange}
          />
        );
      case 'speakers':
        return wrapSectionPreview(
          <SpeakersSection
            speakers={config.speakers}
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      case 'team':
        return wrapSectionPreview(
          <TeamSection
            members={config.team || []}
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      case 'agenda':
        return wrapSectionPreview(
          <AgendaSection
            agenda={config.agenda}
            speakers={config.speakers}
            activeDayId={activePreviewDay}
            onDayChange={onDayChange}
            title={section.title}
            programId={section.programId}
            showDownloadButton={section.showDownloadButton}
          />
        );
      case 'submission':
        return wrapSectionPreview(
          <SubmissionSection
            config={config.submission}
            title={section.title}
            formModalEventId={pageId || 'preview'}
            formModalEventTitle={config.title}
          />
        );
      case 'committee':
        return wrapSectionPreview(
          <ScientificCommitteeSection
            scientificCommittee={resolveScientificCommittee(config)}
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      case 'pricing':
        return wrapSectionPreview(
          <PricingSection
            offers={config.pricing}
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
            eventId={pageId}
            refreshKey={landingPageActions.pricingRefreshKey}
            registrationFormId={section.registrationFormId}
            onSelectOffer={(offer) => {
              if (pageId && section.registrationFormId) {
                landingPageActions.openPricingOffer(offer, section.registrationFormId, pageId);
              }
            }}
          />
        );
      case 'partners':
        return wrapSectionPreview(<PartnersSection groups={config.partners} title={section.title} />);
      case 'faq':
        return wrapSectionPreview(<FaqSection items={config.faq} title={section.title} />);
      case 'eventTopics':
        return wrapSectionPreview(
          <EventTopicsSection
            items={config.eventTopics || []}
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      case 'contact':
        return wrapSectionPreview(<ContactSection config={config.contact} title={section.title} />);
      case 'images':
        return wrapSectionPreview(
          <ImagesSection
            groups={config.imageGroups || []}
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[10000] w-10 h-10 bg-slate-800 text-white rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg"
        aria-label={t('closeFullscreenPreview')}
      >
        <X size={20} />
      </button>

      {activeView === 'about' && linkedEvent ? (
        <EventPage
          event={linkedEvent}
          config={config}
          homeLabel={homeLabel}
          aboutLabel={aboutNavLabel}
          onNavigateHome={() => setActiveView('home')}
          onNavigateAbout={() => setActiveView('about')}
          onSectionClick={() => undefined}
          sections={visibleNavSections}
        />
      ) : (
        <>
          <LandingPageHeader
            config={config}
            activeView="home"
            homeLabel={homeLabel}
            aboutLabel={aboutNavLabel}
            showAbout={showAbout}
            sections={visibleNavSections}
            onNavigateHome={() => setActiveView('home')}
            onNavigateAbout={() => setActiveView('about')}
            onSectionClick={() => undefined}
          />

          {config.sections.map((section) => renderPreviewSection(section))}

          <LandingPageFooter title={config.title} />
        </>
      )}

      {/* Form Modal */}
      {landingPageActions.showFormModal && landingPageActions.selectedFormId && (
        <FormModal
          formId={landingPageActions.selectedFormId}
          eventId={pageId || 'new'}
          eventTitle={config.title}
          ticketContext={landingPageActions.ticketContext}
          onClose={landingPageActions.closeFormModal}
          onSuccess={() => {
            landingPageActions.notifyPricingChanged();
          }}
        />
      )}
    </div>
  );
};

export default FullScreenPreview;

