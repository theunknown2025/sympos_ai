import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ConferenceConfig } from '../../../../types';
import { getPublishedLandingPage } from '../../../../services/landingPageService';
import { Loader2, AlertCircle } from 'lucide-react';
import { isArabic } from '../../../../utils/languageDetection';
import FormModal from '../../Tools/FormBuilder/FormModal';

// Import all preview sections
import FaqSection from '../Sections/FaqSection';
import ScientificCommitteeSection from '../Sections/ScientificCommitteeSection';
import ContactSection from '../Sections/ContactSection';
import SubmissionSection from '../Sections/SubmissionSection';
import PartnersSection from '../Sections/PartnersSection';
import PricingSection from '../Sections/PricingSection';
import AgendaSection from '../Sections/AgendaSection';
import SpeakersSection from '../Sections/SpeakersSection';
import TeamSection from '../Sections/TeamSection';
import ImagesSection from '../Sections/ImagesSection';
import { Type, Calendar, MapPin } from 'lucide-react';

interface PublicLandingPageViewerProps {
  slug?: string; // Optional prop for when rendered outside Routes context
}

const PublicLandingPageViewer: React.FC<PublicLandingPageViewerProps> = ({ slug: slugProp }) => {
  const { slug: slugFromParams } = useParams<{ slug: string }>();
  // Use prop if provided (when rendered directly), otherwise use params (when in Routes)
  const slug = slugProp || slugFromParams;
  const [config, setConfig] = useState<ConferenceConfig | null>(null);
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
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

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
      } else {
        console.warn('[PublicLandingPageViewer] Page data is null');
        setError('Landing page not found or not published');
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
                    onClick={() => {
                      if (b.formId) {
                        setSelectedFormId(b.formId);
                        setShowFormModal(true);
                      } else if (b.url && b.url !== '#') {
                        window.open(b.url, '_blank');
                      }
                    }}
                    className={`px-6 sm:px-8 py-2 sm:py-3 rounded-full font-bold transition-all transform hover:-translate-y-0.5 ${b.style === 'primary' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500' : 'bg-white/10 text-white border border-white/30 backdrop-blur-md hover:bg-white/20'}`}
                  >
                    {b.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'about': {
        const aboutConfig = config!.about || { includeImage: false, imageUrl: '', layout: 'top' };
        const titleAlignment = section.titleAlignment || 'center';
        const titleAlignClass = titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
        const isTitleArabic = isArabic(section.title);
        
        if (aboutConfig.includeImage && aboutConfig.imageUrl) {
          if (aboutConfig.layout === 'top') {
            return (
              <div key={section.id} className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 max-w-6xl mx-auto">
                <h2 className={`text-3xl sm:text-4xl font-bold text-slate-900 mb-8 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
                  {isTitleArabic ? (
                    <>
                      <span>{section.title}</span>
                      <Type size={32} className="text-indigo-600" />
                    </>
                  ) : (
                    <>
                      <Type size={32} className="text-indigo-600" />
                      <span>{section.title}</span>
                    </>
                  )}
                </h2>
                <div className="mb-8">
                  <img src={aboutConfig.imageUrl} alt="" className="w-full h-auto rounded-lg object-cover" />
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{config?.description || ''}</p>
              </div>
            );
          } else if (aboutConfig.layout === 'left-right') {
            return (
              <div key={section.id} className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 max-w-6xl mx-auto">
                <h2 className={`text-3xl sm:text-4xl font-bold text-slate-900 mb-8 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
                  {isTitleArabic ? (
                    <>
                      <span>{section.title}</span>
                      <Type size={32} className="text-indigo-600" />
                    </>
                  ) : (
                    <>
                      <Type size={32} className="text-indigo-600" />
                      <span>{section.title}</span>
                    </>
                  )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{config?.description || ''}</p>
                  </div>
                  <div>
                    <img src={aboutConfig.imageUrl} alt="" className="w-full h-auto rounded-lg object-cover" />
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div key={section.id} className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 max-w-6xl mx-auto">
                <h2 className={`text-3xl sm:text-4xl font-bold text-slate-900 mb-8 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
                  {isTitleArabic ? (
                    <>
                      <span>{section.title}</span>
                      <Type size={32} className="text-indigo-600" />
                    </>
                  ) : (
                    <>
                      <Type size={32} className="text-indigo-600" />
                      <span>{section.title}</span>
                    </>
                  )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <img src={aboutConfig.imageUrl} alt="" className="w-full h-auto rounded-lg object-cover" />
                  </div>
                  <div>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{config?.description || ''}</p>
                  </div>
                </div>
              </div>
            );
          }
        } else {
          return (
            <div key={section.id} className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 max-w-4xl mx-auto">
              <h2 className={`text-3xl sm:text-4xl font-bold text-slate-900 mb-8 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
                {isTitleArabic ? (
                  <>
                    <span>{section.title}</span>
                    <span className="text-indigo-600">T</span>
                  </>
                ) : (
                  <>
                    <span className="text-indigo-600">T</span>
                    <span>{section.title}</span>
                  </>
                )}
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{config?.description || ''}</p>
            </div>
          );
        }
      }
      case 'speakers':
        return (
          <SpeakersSection 
            key={section.id} 
            speakers={config?.speakers || []} 
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      case 'team':
        return (
          <TeamSection 
            key={section.id} 
            members={config?.team || []} 
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      case 'agenda':
        return (
          <AgendaSection 
            key={section.id}
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
        return <SubmissionSection key={section.id} config={config?.submission || {}} title={section.title} />;
      case 'committee':
        return <ScientificCommitteeSection key={section.id} members={config?.committee || []} title={section.title} />;
      case 'pricing':
        return <PricingSection key={section.id} offers={config?.pricing || []} title={section.title} />;
      case 'partners':
        return <PartnersSection key={section.id} groups={config?.partners || []} title={section.title} />;
      case 'faq':
        return <FaqSection key={section.id} items={config?.faq || []} title={section.title} />;
      case 'contact':
        return <ContactSection key={section.id} config={config?.contact || {}} title={section.title} />;
      case 'images':
        return <ImagesSection key={section.id} groups={config?.imageGroups || []} title={section.title} titleAlignment={section.titleAlignment || 'center'} />;
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
  const hero = config.hero || {};
  const header = config.header || {};

  return (
    <div className="min-h-screen bg-white">
      {/* Header / Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {header.showLogo && <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>}
            {header.showTitle && <span className="font-bold text-slate-800 truncate max-w-[150px] sm:max-w-none">{config.title || 'Landing Page'}</span>}
          </div>
          
          {/* NAVIGATION MENU */}
          <div className="hidden md:flex items-center gap-6">
            {sections
              .filter((s: any) => s.isVisible && s.type !== 'hero')
              .map((section: any) => (
                <a 
                  key={section.id} 
                  href={`#${section.id}`}
                  className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                >
                  {section.title}
                </a>
              ))
            }
          </div>

          {header.showActionButton && (
            <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
              {header.actionButtonText || 'Register'}
            </button>
          )}
        </div>
      </nav>

      {/* Sections Rendering Loop */}
      {sections.map((section: any) => (
        <div key={section.id} id={section.id}>
          {renderPreviewSection(section)}
        </div>
      ))}

      <footer className="bg-slate-900 text-white py-12 text-center text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-bold">S</div>
            <span className="font-bold uppercase tracking-widest">{config.title}</span>
          </div>
          <p className="text-slate-500">© 2024 Built with Sympose AI Platform.</p>
        </div>
      </footer>

      {/* Form Modal */}
      {showFormModal && selectedFormId && (
        <FormModal
          formId={selectedFormId}
          eventId={slug || 'public'}
          eventTitle={config.title}
          onClose={() => {
            setShowFormModal(false);
            setSelectedFormId(null);
          }}
          onSuccess={() => {
            // Optionally refresh or show success message
          }}
        />
      )}
    </div>
  );
};

export default PublicLandingPageViewer;
