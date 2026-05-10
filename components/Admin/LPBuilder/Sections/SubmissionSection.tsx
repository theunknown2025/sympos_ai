import React, { useRef, useState } from 'react';
import { HeroButton, SubmissionSectionConfig, TimelineStep, TimelineStepIcon } from '../../../../types';
import {
  FileText,
  ArrowRight,
  Download,
  Calendar,
  Info,
  ChevronLeft,
  ChevronRight,
  Send,
  Clock,
  CheckCircle2,
  Upload,
  Flag,
  Award,
  Link2,
  Image as ImageIcon,
  ClipboardList,
} from 'lucide-react';
import { isArabic } from '../../../../utils/languageDetection';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';
import { useAdminDisplayLanguage } from '../../../../contexts/AdminDisplaySettingsContext';
import FormModal from '../../Tools/FormBuilder/FormModal';

interface SubmissionSectionProps {
  config: SubmissionSectionConfig;
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
  /** Passed to FormModal when a CTA opens a registration form */
  formModalEventId?: string;
  formModalEventTitle?: string;
}

const StepIconMap: Record<TimelineStepIcon, React.ElementType> = {
  calendar: Calendar,
  'file-text': FileText,
  send: Send,
  clock: Clock,
  'check-circle': CheckCircle2,
  info: Info,
  upload: Upload,
  flag: Flag,
  award: Award,
};

function formatStepDeadlineLabel(step: TimelineStep, localeTag: string): string {
  if (step.deadline) {
    const d = new Date(`${step.deadline}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(localeTag, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }
  return step.date || '';
}

function resolveSubmissionAction(btn: HeroButton): 'document' | 'link' | 'image' | 'form' {
  if (btn.actionTarget) return btn.actionTarget;
  if (btn.formId) return 'form';
  return 'link';
}

function resolveSubmissionCtaHref(btn: HeroButton): string | undefined {
  const action = resolveSubmissionAction(btn);
  if (action === 'form') return undefined;
  const pick = (s?: string) => {
    const v = (s || '').trim();
    return v && v !== '#' ? v : undefined;
  };
  if (action === 'document' || action === 'image') {
    return pick(btn.uploadedFileUrl) || pick(btn.url);
  }
  return pick(btn.url);
}

const SubmissionSection: React.FC<SubmissionSectionProps> = ({
  config,
  title = 'Call for Papers',
  titleAlignment = 'center',
  formModalEventId = 'preview',
  formModalEventTitle = '',
}) => {
  const { t } = useAdminTranslation('pageBuilder');
  const language = useAdminDisplayLanguage();
  const localeTag = language === 'fr' ? 'fr-FR' : 'en-US';
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleAlignClass = titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
  const containerAlignClass = titleAlignment === 'left' ? 'items-start' : titleAlignment === 'right' ? 'items-end' : 'items-center';
  const isTitleArabic = isArabic(title);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  const steps = config.steps || [];
  const buttons = config.buttons || [];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;

      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth',
      });
    }
  };

  const onCtaClick = (btn: HeroButton) => {
    const action = resolveSubmissionAction(btn);
    if (action === 'form' && btn.formId) {
      setSelectedFormId(btn.formId);
      setShowFormModal(true);
      return;
    }
    const href = resolveSubmissionCtaHref(btn);
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  const ctaTrailingIcon = (btn: HeroButton) => {
    const action = resolveSubmissionAction(btn);
    if (action === 'document') return <Download size={18} />;
    if (action === 'image') return <ImageIcon size={18} />;
    if (action === 'form') return <ClipboardList size={18} />;
    if (action === 'link') return <Link2 size={18} />;
    return <ArrowRight size={18} />;
  };

  return (
    <div className="py-24 px-8 bg-slate-50 border-t border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col ${containerAlignClass} mb-16`}>
          <h2 className={`text-4xl font-bold text-slate-900 mb-4 ${titleAlignClass} flex items-center gap-3 ${isTitleArabic ? 'flex-row-reverse' : ''}`}>
            {isTitleArabic ? (
              <>
                <span>{title}</span>
                <FileText size={32} className="text-indigo-600" />
              </>
            ) : (
              <>
                <FileText size={32} className="text-indigo-600" />
                <span>{title}</span>
              </>
            )}
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">{t('edSecSubmissionIntro')}</p>
        </div>

        <div className="relative mb-16 group/carousel">
          {steps.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:translate-x-0"
                aria-label={t('edAriaPrevSteps')}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all opacity-0 group-hover/carousel:opacity-100 group-hover/carousel:translate-x-0"
                aria-label={t('edAriaNextSteps')}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {steps.map((step, index) => {
              const iconKey: TimelineStepIcon = step.icon || 'calendar';
              const StepIcon = StepIconMap[iconKey] || Calendar;
              const deadlineLabel = formatStepDeadlineLabel(step, localeTag);

              return (
                <div key={step.id} className="flex-none w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] snap-start">
                  <div className="group bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-slate-50 font-bold text-8xl pointer-events-none transition-colors group-hover:text-indigo-50/50">
                      {index + 1}
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6 w-fit">
                        <StepIcon size={14} />
                        {deadlineLabel || t('edSubmissionNoDeadlineBadge')}
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">{step.title}</h3>

                      <div className="w-10 h-1 bg-indigo-600 rounded-full mb-6 transition-all group-hover:w-20" />

                      <p className="text-slate-600 leading-relaxed text-sm flex-grow whitespace-pre-wrap">{step.description}</p>

                      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-xs font-medium text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Info size={14} className="text-indigo-400" />
                          {t('edSecSubmissionMilestone', { n: index + 1 })}
                        </div>
                        {index === steps.length - 1 && <span className="text-emerald-500 font-bold">{t('edSecSubmissionStart')}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {buttons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => onCtaClick(btn)}
              className={`px-10 py-4 rounded-xl font-bold transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 shadow-lg ${
                btn.style === 'primary'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 shadow-slate-200'
              }`}
            >
              {btn.text}
              {ctaTrailingIcon(btn)}
            </button>
          ))}
          {buttons.length === 0 && (
            <div className="text-slate-400 italic bg-white px-8 py-3 rounded-full border border-dashed border-slate-200">{t('edSecSubmissionNoActions')}</div>
          )}
        </div>
      </div>

      {showFormModal && selectedFormId && (
        <FormModal
          formId={selectedFormId}
          eventId={formModalEventId}
          eventTitle={formModalEventTitle}
          onClose={() => {
            setShowFormModal(false);
            setSelectedFormId(null);
          }}
        />
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default SubmissionSection;
