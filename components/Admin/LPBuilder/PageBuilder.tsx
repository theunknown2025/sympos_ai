import React, { useState, useEffect } from 'react';
import { ConferenceConfig } from '../../../types';
import { INITIAL_CONFERENCE_CONFIG } from '../../../constants';
import { 
  Eye, Save, Layout, GripVertical, Settings2, 
  Type, Users, Award, HelpCircle, Menu as MenuIcon, 
  FileText, Mail, ChevronDown, ChevronUp, Tag,
  ArrowUp, ArrowDown, Clock, X, Loader2, AlertCircle, ArrowLeft, Calendar, MapPin, Maximize2
} from 'lucide-react';
import { generateDescription } from '../../../services/geminiService';
import { useAuth } from '../../../hooks/useAuth';
import { saveLandingPage, updateLandingPage, getLandingPage } from '../../../services/landingPageService';
import FormModal from '../Tools/FormBuilder/FormModal';
import { isArabic } from '../../../utils/languageDetection';

// Preview Sections
import FaqSection from './FaqSection';
import ScientificCommitteeSection from './ScientificCommitteeSection';
import ContactSection from './ContactSection';
import SubmissionSection from './SubmissionSection';
import PartnersSection from './PartnersSection';
import PricingSection from './PricingSection';
import AgendaSection from './AgendaSection';
import SpeakersSection from './SpeakersSection';
import TeamSection from './TeamSection';
// Editor Components
import HeaderEditor from './HeaderEditor';
import HeroEditor from './HeroEditor';
import AboutEditor from './AboutEditor';
import SpeakersEditor from './SpeakersEditor';
import CommitteeEditor from './CommitteeEditor';
import TeamEditor from './TeamEditor';
import AgendaEditor from './AgendaEditor';
import FaqEditor from './FaqEditor';
import ContactEditor from './ContactEditor';
import SubmissionEditor from './SubmissionEditor';
import PartnersEditor from './PartnersEditor';
import PricingEditor from './PricingEditor';
import FullScreenPreview from './FullScreenPreview';

interface PageBuilderProps {
  pageId?: string;
  onBack?: () => void;
}

const PageBuilder: React.FC<PageBuilderProps> = ({ pageId, onBack }) => {
  const [config, setConfig] = useState<ConferenceConfig>(INITIAL_CONFERENCE_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>('sec-1');
  const [activePreviewDay, setActivePreviewDay] = useState<string>(config.agenda[0]?.id || '');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(!!pageId);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Countdown Logic
  useEffect(() => {
    if (!config.date) return;
    const calculateTimeLeft = () => {
      const difference = +new Date(config.date) - +new Date();
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, [config.date]);

  // Ensure active day stays valid if agenda changes
  useEffect(() => {
    if (config.agenda.length > 0 && !config.agenda.find(d => d.id === activePreviewDay)) {
      setActivePreviewDay(config.agenda[0].id);
    }
  }, [config.agenda, activePreviewDay]);

  // Load existing page if pageId is provided
  useEffect(() => {
    if (currentUser && pageId) {
      loadPage(pageId);
    } else if (!pageId) {
      setIsLoading(false);
      setSaveTitle(config.title);
    }
  }, [pageId, currentUser]);

  const loadPage = async (id: string) => {
    try {
      setIsLoading(true);
      const page = await getLandingPage(id);
      if (page) {
        setConfig(page.config);
        setSaveTitle(page.title);
        if (page.config.agenda.length > 0) {
          setActivePreviewDay(page.config.agenda[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      setSaveError('You must be logged in to save pages');
      return;
    }

    if (!saveTitle.trim()) {
      setSaveError('Please enter a title for your landing page');
      return;
    }

    // Validate config has required fields
    if (!config.title || !config.title.trim()) {
      setSaveError('Please set a main title in the Hero section');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError('');
      setSaveSuccess(false);

      if (pageId) {
        // Update existing page
        await updateLandingPage(pageId, saveTitle.trim(), config);
      } else {
        // Create new page
        const newPageId = await saveLandingPage(currentUser.id, saveTitle.trim(), config);
        // Store the new page ID for potential future updates
        console.log('New page created with ID:', newPageId);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setShowSaveDialog(false);
        setSaveSuccess(false);
        // Don't automatically go back - let user continue editing
      }, 2000);
    } catch (error: any) {
      console.error('Error saving page:', error);
      // Provide more specific error messages
      let errorMessage = 'Failed to save landing page. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to save this page.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service is temporarily unavailable. Please try again later.';
      }
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    const description = await generateDescription(config.title, config.location);
    setConfig(prev => ({ ...prev, description }));
    setIsGenerating(false);
  };

  const toggleSectionVisibility = (id: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, isVisible: !s.isVisible } : s)
    }));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...config.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    const [movedItem] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, movedItem);
    setConfig(prev => ({ ...prev, sections: newSections }));
  };

  const toggleAccordion = (id: string) => {
    setExpandedSectionId(expandedSectionId === id ? null : id);
  };

  const getSectionIcon = (type: string) => {
    switch(type) {
      case 'hero': return <Layout size={16} />;
      case 'about': return <Type size={16} />;
      case 'speakers': return <Users size={16} />;
      case 'committee': return <Award size={16} />;
      case 'team': return <Users size={16} />;
      case 'agenda': return <FileText size={16} />;
      case 'faq': return <HelpCircle size={16} />;
      case 'contact': return <Mail size={16} />;
      case 'submission': return <FileText size={16} />;
      case 'partners': return <Users size={16} />;
      case 'pricing': return <Tag size={16} />;
      default: return <Layout size={16} />;
    }
  };

  const renderSectionEditor = (type: string) => {
    switch (type) {
      case 'hero': return (
        <HeroEditor 
          config={config.hero} 
          onChange={(val) => setConfig({ ...config, hero: val })} 
          title={config.title}
          onTitleChange={(title) => setConfig({ ...config, title })}
          date={config.date}
          location={config.location}
          onDateChange={(date) => setConfig({ ...config, date })}
          onLocationChange={(location) => setConfig({ ...config, location })}
        />
      );
      case 'about': return (
        <AboutEditor 
          description={config.description} 
          isGenerating={isGenerating} 
          onDescriptionChange={(val) => setConfig({ ...config, description: val })} 
          onAiGenerate={handleAiGenerate}
          aboutConfig={config.about}
          onAboutConfigChange={(aboutConfig) => setConfig({ ...config, about: aboutConfig })}
        />
      );
      case 'speakers': return <SpeakersEditor speakers={config.speakers} onChange={(val) => setConfig({ ...config, speakers: val })} />;
      case 'committee': return <CommitteeEditor committee={config.committee} onChange={(val) => setConfig({ ...config, committee: val })} />;
      case 'team': return <TeamEditor members={config.team || []} onChange={(val) => setConfig({ ...config, team: val })} />;
      case 'agenda': {
        const section = config.sections.find(s => s.type === 'agenda');
        return (
          <AgendaEditor 
            agenda={config.agenda} 
            speakers={config.speakers} 
            onChange={(val) => setConfig({ ...config, agenda: val })}
            programId={section?.programId}
            showDownloadButton={section?.showDownloadButton}
            onProgramConfigChange={(val) => {
              const updatedSections = config.sections.map(s =>
                s.type === 'agenda' ? { ...s, ...val } : s
              );
              setConfig({ ...config, sections: updatedSections });
            }}
          />
        );
      }
      case 'faq': return <FaqEditor faq={config.faq} onChange={(val) => setConfig({ ...config, faq: val })} />;
      case 'contact': return <ContactEditor config={config.contact} onChange={(val) => setConfig({ ...config, contact: val })} />;
      case 'submission': return <SubmissionEditor config={config.submission} onChange={(val) => setConfig({ ...config, submission: val })} />;
      case 'partners': return <PartnersEditor partners={config.partners} onChange={(val) => setConfig({ ...config, partners: val })} />;
      case 'pricing': return <PricingEditor pricing={config.pricing} onChange={(val) => setConfig({ ...config, pricing: val })} />;
      default: return null;
    }
  };

  const renderPreviewSection = (section: any) => {
    if (!section.isVisible) return null;

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
              
              {/* General Information - Date and Location */}
              {(config.hero.showDate || config.hero.showLocation) && (
                <div className={`flex gap-6 mb-8 ${config.hero.layout === 'center' ? 'justify-center' : 'justify-start'}`}>
                  {config.hero.showDate && config.date && (
                    <div className="flex items-center gap-2 text-white/90">
                      <Calendar size={20} className="text-indigo-300" />
                      <span className="text-lg font-medium">
                        {new Date(config.date).toLocaleDateString('en-US', { 
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
                    { label: 'Days', value: timeLeft.days },
                    { label: 'Hours', value: timeLeft.hours },
                    { label: 'Min', value: timeLeft.minutes },
                    { label: 'Sec', value: timeLeft.seconds }
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
                    onClick={() => {
                      if (b.formId) {
                        setSelectedFormId(b.formId);
                        setShowFormModal(true);
                      } else if (b.url && b.url !== '#') {
                        window.open(b.url, '_blank');
                      }
                    }}
                    className={`px-8 py-3 rounded-full font-bold transition-all transform hover:-translate-y-0.5 ${b.style === 'primary' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500' : 'bg-white/10 text-white border border-white/30 backdrop-blur-md hover:bg-white/20'}`}
                  >
                    {b.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'about': {
        const aboutConfig = config.about || { includeImage: false, imageUrl: '', layout: 'top' };
        const titleAlignment = section.titleAlignment || 'center';
        const titleAlignClass = titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
        const isTitleArabic = isArabic(section.title);
        
        if (aboutConfig.includeImage && aboutConfig.imageUrl) {
          // Layout with image
          if (aboutConfig.layout === 'top') {
            return (
              <div key={section.id} className="py-24 px-8 max-w-6xl mx-auto">
                <h2 className={`text-4xl font-bold text-slate-900 mb-8 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
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
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{config.description}</p>
              </div>
            );
          } else if (aboutConfig.layout === 'left-right') {
            return (
              <div key={section.id} className="py-24 px-8 max-w-6xl mx-auto">
                <h2 className={`text-4xl font-bold text-slate-900 mb-8 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
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
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{config.description}</p>
                  </div>
                  <div>
                    <img src={aboutConfig.imageUrl} alt="" className="w-full h-auto rounded-lg object-cover" />
                  </div>
                </div>
              </div>
            );
          } else { // right-left
            return (
              <div key={section.id} className="py-24 px-8 max-w-6xl mx-auto">
                <h2 className={`text-4xl font-bold text-slate-900 mb-8 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
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
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{config.description}</p>
                  </div>
                </div>
              </div>
            );
          }
        } else {
          // No image
          return (
            <div key={section.id} className="py-24 px-8 max-w-4xl mx-auto">
              <h2 className={`text-4xl font-bold text-slate-900 mb-8 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
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
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{config.description}</p>
            </div>
          );
        }
      }
      case 'speakers':
        return (
          <SpeakersSection 
            key={section.id} 
            speakers={config.speakers} 
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      case 'team':
        return (
          <TeamSection 
            key={section.id} 
            members={config.team || []} 
            title={section.title}
            titleAlignment={section.titleAlignment || 'center'}
          />
        );
      case 'agenda':
        return (
          <AgendaSection 
            key={section.id}
            agenda={config.agenda} 
            speakers={config.speakers} 
            activeDayId={activePreviewDay} 
            onDayChange={setActivePreviewDay} 
            title={section.title}
            programId={section.programId}
            showDownloadButton={section.showDownloadButton}
          />
        );
      case 'submission':
        return <SubmissionSection key={section.id} config={config.submission} title={section.title} />;
      case 'committee':
        return <ScientificCommitteeSection key={section.id} members={config.committee} title={section.title} />;
      case 'pricing':
        return <PricingSection key={section.id} offers={config.pricing} title={section.title} />;
      case 'partners':
        return <PartnersSection key={section.id} groups={config.partners} title={section.title} />;
      case 'faq':
        return <FaqSection key={section.id} items={config.faq} title={section.title} />;
      case 'contact':
        return <ContactSection key={section.id} config={config.contact} title={section.title} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 mt-4">Loading landing page...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-3xl font-bold text-slate-900">Landing Page Builder</h1>
          </div>
          <p className="text-slate-500 mt-1 text-sm">Design your conference website. Reorder sections and preview in real-time.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Eye size={18} /> Preview
          </button>
          <button 
            onClick={() => {
              // Auto-fill save title if empty
              if (!saveTitle && config.title) {
                setSaveTitle(config.title);
              }
              setShowSaveDialog(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
          >
            <Save size={18} /> {pageId ? 'Save Changes' : 'Save Page'}
          </button>
        </div>
      </header>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {pageId ? 'Save Changes' : 'Save Landing Page'}
              </h2>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveError('');
                  setSaveSuccess(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Landing Page Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => {
                    setSaveTitle(e.target.value);
                    setSaveError(''); // Clear error when user types
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && saveTitle.trim() && !isSaving) {
                      handleSave();
                    }
                  }}
                  placeholder="e.g., International AI Conference 2024"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  disabled={isSaving}
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1">
                  This title will be used to identify your page in the list
                </p>
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  <span>{saveError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Landing page saved successfully! {pageId ? 'Changes have been updated.' : 'Your page is now saved.'}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveError('');
                    setSaveSuccess(false);
                  }}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !saveTitle.trim()}
                  className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {pageId ? 'Save Changes' : 'Save Page'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Settings2 size={18} /> Editor Controls
            </h3>
          </div>
          
          <div className="p-4 space-y-4 overflow-y-auto">

            {/* Header Settings (Fixed position) */}
            <div className={`border rounded-lg overflow-hidden transition-all duration-200 ${expandedSectionId === 'header-settings' ? 'border-indigo-200 shadow-md' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between p-3 bg-slate-50/50 cursor-pointer" onClick={() => toggleAccordion('header-settings')}>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md border bg-white border-slate-200 text-slate-400">
                    <MenuIcon size={16} />
                  </div>
                  <span className="font-semibold text-sm">Header Settings</span>
                </div>
                {expandedSectionId === 'header-settings' ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
              </div>
              {expandedSectionId === 'header-settings' && (
                <div className="p-4 bg-white border-t border-slate-100">
                   <HeaderEditor config={config.header} onChange={(val) => setConfig({...config, header: val})} />
                </div>
              )}
            </div>

            {/* Reorderable Sections */}
            {config.sections.map((section, index) => (
              <div key={section.id} className={`border rounded-lg overflow-hidden transition-all duration-200 ${expandedSectionId === section.id ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50">
                  <div className="flex items-center gap-3 flex-1 cursor-pointer select-none" onClick={() => toggleAccordion(section.id)}>
                    <div className="flex flex-col gap-0.5">
                      <button 
                        disabled={index === 0}
                        onClick={(e) => { e.stopPropagation(); moveSection(index, 'up'); }}
                        className={`text-slate-300 hover:text-indigo-600 disabled:opacity-0 ${index === 0 ? 'pointer-events-none' : ''}`}
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button 
                        disabled={index === config.sections.length - 1}
                        onClick={(e) => { e.stopPropagation(); moveSection(index, 'down'); }}
                        className={`text-slate-300 hover:text-indigo-600 disabled:opacity-0 ${index === config.sections.length - 1 ? 'pointer-events-none' : ''}`}
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                    <div className={`p-1.5 rounded-md border ${expandedSectionId === section.id ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                      {getSectionIcon(section.type)}
                    </div>
                    <span className={`font-semibold text-sm ${expandedSectionId === section.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {section.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={section.isVisible} onChange={() => toggleSectionVisibility(section.id)} />
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                </div>
                {expandedSectionId === section.id && (
                  <div className="p-4 bg-white border-t border-slate-100 animate-fade-in">
                    {/* Title Alignment Control */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-slate-700 mb-2">Title Alignment</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfig({
                            ...config,
                            sections: config.sections.map(s => 
                              s.id === section.id ? { ...s, titleAlignment: 'left' } : s
                            )
                          })}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                            (section.titleAlignment || 'center') === 'left'
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Type size={14} className="rotate-90" />
                          <span className="text-xs font-medium">Left</span>
                        </button>
                        <button
                          onClick={() => setConfig({
                            ...config,
                            sections: config.sections.map(s => 
                              s.id === section.id ? { ...s, titleAlignment: 'center' } : s
                            )
                          })}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                            (section.titleAlignment || 'center') === 'center'
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Type size={14} />
                          <span className="text-xs font-medium">Center</span>
                        </button>
                        <button
                          onClick={() => setConfig({
                            ...config,
                            sections: config.sections.map(s => 
                              s.id === section.id ? { ...s, titleAlignment: 'right' } : s
                            )
                          })}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                            (section.titleAlignment || 'center') === 'right'
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Type size={14} className="-rotate-90" />
                          <span className="text-xs font-medium">Right</span>
                        </button>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Section Display Title</label>
                      <input 
                        type="text" 
                        value={section.title}
                        onChange={(e) => {
                          const newSections = config.sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s);
                          setConfig({ ...config, sections: newSections });
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                      />
                    </div>
                    {renderSectionEditor(section.type)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-2 bg-slate-200 rounded-xl overflow-hidden border border-slate-300 flex flex-col shadow-inner">
          <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700 shrink-0">
            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
            <div className="mx-auto bg-slate-900 text-slate-400 text-xs px-4 py-1.5 rounded-full w-2/3 text-center border border-slate-700 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              sympose-ai.com/preview/conference
            </div>
            <button
              onClick={() => setIsFullScreen(true)}
              className="ml-auto p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Full screen preview"
              title="Full screen preview"
            >
              <Maximize2 size={18} />
            </button>
          </div>
          <div className="flex-1 bg-white overflow-y-auto scrollbar-hide relative">
            {/* Header / Navigation Preview */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
               <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     {config.header.showLogo && <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>}
                     {config.header.showTitle && <span className="font-bold text-slate-800 truncate max-w-[150px]">{config.title}</span>}
                  </div>
                  
                  {/* NAVIGATION MENU - Derived from visible sections */}
                  <div className="hidden md:flex items-center gap-6">
                    {config.sections
                      .filter(s => s.isVisible && s.type !== 'hero')
                      .map(section => (
                        <a key={section.id} href="#" className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider">
                          {section.title}
                        </a>
                      ))
                    }
                  </div>

                  {config.header.showActionButton && <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">{config.header.actionButtonText}</button>}
               </div>
            </nav>

            {/* Sections Rendering Loop */}
            {config.sections.map(section => renderPreviewSection(section))}

            <footer className="bg-slate-900 text-white py-12 text-center text-xs border-t border-slate-800">
              <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-bold">S</div>
                  <span className="font-bold uppercase tracking-widest">{config.title}</span>
                </div>
                <p className="text-slate-500">© 2024 Built with Sympose AI Platform.</p>
              </div>
            </footer>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showFormModal && selectedFormId && (
        <FormModal
          formId={selectedFormId}
          eventId={pageId || 'new'}
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

      {/* Full Screen Preview */}
      {isFullScreen && (
        <FullScreenPreview
          config={config}
          activePreviewDay={activePreviewDay}
          onDayChange={setActivePreviewDay}
          timeLeft={timeLeft}
          onClose={() => setIsFullScreen(false)}
          pageId={pageId}
        />
      )}
    </div>
  );
};

export default PageBuilder;