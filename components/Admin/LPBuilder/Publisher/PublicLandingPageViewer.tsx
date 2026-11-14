import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ConferenceConfig, Event } from '../../../../types';
import { getPublishedLandingPage } from '../../../../services/landingPageService';
import { getPublishedEventForLandingPage } from '../../../../services/eventService';
import { Loader2, AlertCircle } from 'lucide-react';
import FormModal from '../../Tools/FormBuilder/FormModal';

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
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';
import { Calendar, MapPin } from 'lucide-react';
import { EventPage, LandingPageHeader, LandingPageFooter } from '../Pages';
import type { LandingPageView } from '../Pages';

interface PublicLandingPageViewerProps {
  slug?: string; // Optional prop for when rendered outside Routes context
}

const PublicLandingPageViewer: React.FC<PublicLandingPageViewerProps> = ({ slug: slugProp }) => {
  const { slug: slugFromParams } = useParams<{ slug: string }>();
  // Use prop if provided (when rendered directly), otherwise use params (when in Routes)
  const slug = slugProp || slugFromParams;
  const [config, setConfig] = useState<ConferenceConfig | null>(null);
  const [landingPageId, setLandingPageId] = useState<string | null>(null);
  const [linkedEvent, setLinkedEvent] = useState<Event | null>(null);
  const [activeView, setActiveView] = useState<LandingPageView>('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial mount logging
  React.useEffect(() => {
    console.log('[PublicLandingPageViewer] Component mounted');
    console.log('[PublicLandingPageViewer] Slug from URL:', slug);
    console.log('[PublicLandingPageViewer] Full URL:', window.location.href);
  }, []);
  const [activePreviewDay, setActivePreviewDay] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { t } = useAdminTranslation('pageBuilder');
  const landingPageActions = useLandingPageActionHandler({
    evaluationUnavailable: t('edSecActionEvaluationUnavailable'),
  });

  const loadPage = React.useCallback(async () => {
    if (!slug) {
      console.error('No slug provided');
      setError('No slug provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[PublicLandingPageViewer] Loading published page with slug:', slug);
      console.log('[PublicLandingPageViewer] Current URL:', window.location.href);
      
      // Add a timeout to detect hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
      );
      
      const pageDataPromise = getPublishedLandingPage(slug);
      const pageData = await Promise.race([pageDataPromise, timeoutPromise]) as any;
      
      console.log('[PublicLandingPageViewer] Page data received:', pageData);
      if (pageData) {
        console.log('[PublicLandingPageViewer] Setting config:', pageData.config);
        setConfig(pageData.config);
        setLandingPageId(pageData.id || null);
      } else {
        console.warn('[PublicLandingPageViewer] Page data is null');
        setError('Landing page not found or not published');
        setLandingPageId(null);
        setLinkedEvent(null);
      }
    } catch (err: any) {
      console.error('[PublicLandingPageViewer] Error loading published landing page:', err);
      console.error('[PublicLandingPageViewer] Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      setError(err.message || 'Failed to load landing page');
    } finally {
      console.log('[PublicLandingPageViewer] Setting loading to false');
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      loadPage();
    } else {
      setError('No slug provided in URL');
      setLoading(false);
    }
  }, [slug, loadPage]);

  useEffect(() => {
    let cancelled = false;
    const loadAboutEvent = async () => {
      if (!landingPageId) {
        setLinkedEvent(null);
        return;
      }
      try {
        const event = await getPublishedEventForLandingPage(landingPageId);
        if (!cancelled) {
          setLinkedEvent(event);
          if (!event) setActiveView('home');
        }
      } catch {
        if (!cancelled) {
          setLinkedEvent(null);
          setActiveView('home');
        }
      }
    };
    loadAboutEvent();
    return () => {
      cancelled = true;
    };
  }, [landingPageId]);

  useEffect(() => {
    if (config?.agenda?.days && Array.isArray(config.agenda.days) && config.agenda.days.length > 0) {
      setActivePreviewDay(config.agenda.days[0].id);
    }
  }, [config]);

  useEffect(() => {
    if (!config?.hero?.showTimer || !config.date) return;

    const calculateTimeLeft = () => {
      const targetDate = new Date(config.date).getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [config]);


  const renderPreviewSection = (section: any) => {
    if (!section || !section.isVisible || !config) return null;

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
        const heroConfig = config.hero || {};
        const heroLayout = heroConfig.layout || 'center';
        const backgroundImage = heroConfig.backgroundImage || '';
        const overlayOpacity = heroConfig.overlayOpacity || 50;
        const heroButtons = Array.isArray(heroConfig.buttons) ? heroConfig.buttons : [];
        
        return (
          <div key={section.id} className={`relative min-h-[600px] flex flex-col justify-center px-4 sm:px-8 md:px-20 ${heroLayout === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
            {backgroundImage && (
              <div className="absolute inset-0 z-0">
                <img src={backgroundImage} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-slate-900" style={{ opacity: overlayOpacity / 100 }}></div>
              </div>
            )}
            <div className="relative z-10 animate-fade-in-up">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">{config.title || 'Landing Page'}</h1>
              {heroConfig.tagline && <p className="text-lg sm:text-xl text-slate-200 mb-8 max-w-2xl font-light">{heroConfig.tagline}</p>}
              
              {(heroConfig.showDate || heroConfig.showLocation) && (
                <div className={`flex flex-wrap gap-4 sm:gap-6 mb-8 ${heroLayout === 'center' ? 'justify-center' : 'justify-start'}`}>
                  {heroConfig.showDate && config.date && (
                    <div className="flex items-center gap-2 text-white/90">
                      <Calendar size={20} className="text-indigo-300" />
                      <span className="text-base sm:text-lg font-medium">
                        {new Date(config.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                  {heroConfig.showLocation && config.location && (
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin size={20} className="text-indigo-300" />
                      <span className="text-base sm:text-lg font-medium">{config.location}</span>
                    </div>
                  )}
                </div>
              )}
              
              {heroConfig.showTimer && (
                <div className={`flex gap-2 sm:gap-4 mb-10 ${heroLayout === 'center' ? 'justify-center' : 'justify-start'}`}>
                  {[
                    { label: 'Days', value: timeLeft.days },
                    { label: 'Hours', value: timeLeft.hours },
                    { label: 'Min', value: timeLeft.minutes },
                    { label: 'Sec', value: timeLeft.seconds }
                  ].map((unit, i) => (
                    <div key={i} className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-xl p-2 sm:p-3 min-w-[60px] sm:min-w-[70px] border border-white/20 shadow-xl">
                      <span className="text-xl sm:text-2xl font-bold text-white font-mono">{String(unit.value).padStart(2, '0')}</span>
                      <span className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold mt-1">{unit.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                {heroButtons.map((b: any) => (
                  <button 
                    key={b.id} 
                    onClick={() => landingPageActions.handleActionClick(b)}
                    className={`px-6 sm:px-8 py-2 sm:py-3 rounded-full font-bold transition-all transform hover:-translate-y-0.5 ${b.style === 'primary' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500' : 'bg-white/10 text-white border border-white/30 backdrop-blur-md hover:bg-white/20'}`}
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
            description={config?.description || ''}
            titleAlignment={section.titleAlignment || 'center'}
            aboutConfig={config?.about}
          />
        );
      case 'speakers':
        return wrapSectionPreview(
          <SpeakersSection
            speakers={config?.speakers || []}
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      case 'team':
        return wrapSectionPreview(
          <TeamSection
            members={config?.team || []}
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      case 'agenda':
        return wrapSectionPreview(
          <AgendaSection
            agenda={config?.agenda || { days: [] }}
            speakers={config?.speakers || []}
            activeDayId={activePreviewDay}
            onDayChange={setActivePreviewDay}
            title={section.title}
            programId={section.programId}
            showDownloadButton={section.showDownloadButton}
          />
        );
      case 'submission':
        return wrapSectionPreview(
          <SubmissionSection
            config={config.submission ?? { steps: [], buttons: [] }}
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
            formModalEventId={slug || 'public'}
            formModalEventTitle={config?.title || ''}
          />
        );
      case 'committee':
        return wrapSectionPreview(
          <ScientificCommitteeSection
            scientificCommittee={resolveScientificCommittee(config || {})}
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      case 'pricing':
        return wrapSectionPreview(
          <PricingSection
            offers={config?.pricing || []}
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
            eventId={landingPageId || undefined}
            refreshKey={landingPageActions.pricingRefreshKey}
            registrationFormId={section.registrationFormId}
            onSelectOffer={(offer) => {
              if (landingPageId && section.registrationFormId) {
                landingPageActions.openPricingOffer(offer, section.registrationFormId, landingPageId);
              }
            }}
          />
        );
      case 'partners':
        return wrapSectionPreview(<PartnersSection groups={config?.partners || []} title={section.title} />);
      case 'faq':
        return wrapSectionPreview(<FaqSection items={config?.faq || []} title={section.title} />);
      case 'eventTopics':
        return wrapSectionPreview(
          <EventTopicsSection
            items={config?.eventTopics || []}
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      case 'contact':
        return wrapSectionPreview(<ContactSection config={config?.contact || {}} title={section.title} />);
      case 'images':
        return wrapSectionPreview(
          <ImagesSection
            groups={config?.imageGroups || []}
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      default:
        return null;
    }
  };

  // Debug logging
  React.useEffect(() => {
    console.log('[PublicLandingPageViewer] Component mounted/updated:', {
      slug,
      loading,
      error,
      hasConfig: !!config,
      url: window.location.href
    });
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium">Loading landing page...</p>
        {slug && <p className="text-xs text-slate-400">Slug: {slug}</p>}
        <p className="text-xs text-slate-400">Check browser console for details</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="text-red-500" size={48} />
        <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
        <p className="text-slate-600 text-center max-w-md">{error || 'This landing page is not available or has been unpublished.'}</p>
      </div>
    );
  }

  // Validate config has required properties
  if (!config.hero || !config.sections || !config.header) {
    console.error('[PublicLandingPageViewer] Invalid config structure:', config);
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="text-red-500" size={48} />
        <h1 className="text-2xl font-bold text-slate-900">Invalid Page Configuration</h1>
        <p className="text-slate-600 text-center max-w-md">This landing page has an invalid configuration. Please contact the page owner.</p>
      </div>
    );
  }

  // Ensure sections is an array
  const sections = Array.isArray(config.sections) ? config.sections : [];
  const visibleNavSections = sections
    .filter((s: { isVisible?: boolean; type?: string }) => s.isVisible && s.type !== 'hero')
    .map((s: { id: string; title: string }) => ({ id: s.id, title: s.title }));

  if (activeView === 'about' && linkedEvent) {
    return (
      <div className="min-h-screen bg-white">
        <EventPage
          event={linkedEvent}
          config={config}
          homeLabel={t('homeMenu')}
          aboutLabel={t('aboutNavLabel')}
          onNavigateHome={() => setActiveView('home')}
          onNavigateAbout={() => setActiveView('about')}
          onSectionClick={(sectionId) => {
            setActiveView('home');
            window.setTimeout(() => {
              const el = document.getElementById(sectionId);
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 0);
          }}
          sections={visibleNavSections}
        />
        {landingPageActions.showFormModal && landingPageActions.selectedFormId && (
          <FormModal
            formId={landingPageActions.selectedFormId}
            eventId={landingPageId || slug || 'public'}
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
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingPageHeader
        config={config}
        activeView="home"
        homeLabel={t('homeMenu')}
        aboutLabel={t('aboutNavLabel')}
        showAbout={Boolean(linkedEvent)}
        sections={visibleNavSections}
        onNavigateHome={() => setActiveView('home')}
        onNavigateAbout={() => setActiveView('about')}
        onSectionClick={(sectionId) => {
          const el = document.getElementById(sectionId);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

      {/* Sections Rendering Loop */}
      {sections.map((section: any) => (
        <div key={section.id} id={section.id}>
          {renderPreviewSection(section)}
        </div>
      ))}

      <LandingPageFooter title={config.title} />

      {/* Form Modal */}
      {landingPageActions.showFormModal && landingPageActions.selectedFormId && (
        <FormModal
          formId={landingPageActions.selectedFormId}
          eventId={landingPageId || slug || 'public'}
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

export default PublicLandingPageViewer;
