import React, { useState } from 'react';
import { ConferenceConfig } from '../../../types';
import { X, Type } from 'lucide-react';
import { isArabic } from '../../../utils/languageDetection';
import FormModal from '../Tools/FormBuilder/FormModal';

// Import all preview sections
import FaqSection from './FaqSection';
import ScientificCommitteeSection from './ScientificCommitteeSection';
import ContactSection from './ContactSection';
import SubmissionSection from './SubmissionSection';
import PartnersSection from './PartnersSection';
import PricingSection from './PricingSection';
import AgendaSection from './AgendaSection';
import SpeakersSection from './SpeakersSection';
import TeamSection from './TeamSection';
import { Calendar, MapPin } from 'lucide-react';

interface FullScreenPreviewProps {
  config: ConferenceConfig;
  activePreviewDay: string;
  onDayChange: (dayId: string) => void;
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  onClose: () => void;
  pageId?: string;
}

const FullScreenPreview: React.FC<FullScreenPreviewProps> = ({
  config,
  activePreviewDay,
  onDayChange,
  timeLeft,
  onClose,
  pageId
}) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
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
          } else {
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
          return (
            <div key={section.id} className="py-24 px-8 max-w-4xl mx-auto">
              <h2 className={`text-4xl font-bold text-slate-900 mb-8 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
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
            onDayChange={onDayChange} 
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

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[10000] w-10 h-10 bg-slate-800 text-white rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg"
        aria-label="Close full screen"
      >
        <X size={20} />
      </button>

      {/* Header / Navigation Preview */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.header.showLogo && <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>}
            {config.header.showTitle && <span className="font-bold text-slate-800 truncate max-w-[150px]">{config.title}</span>}
          </div>
          
          {/* NAVIGATION MENU */}
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

          {config.header.showActionButton && (
            <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
              {config.header.actionButtonText}
            </button>
          )}
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
    </div>
  );
};

export default FullScreenPreview;

