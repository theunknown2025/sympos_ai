import React, { useEffect, useState } from 'react';
import { Eye, Layers, X } from 'lucide-react';
import type { EventTopicItem } from '../../../../types';
import { isArabic } from '../../../../utils/languageDetection';
import { useAdminTranslation } from '../../../../i18n/admin/hooks/useAdminTranslation';
import { resolveEventTopicIcon } from '../shared/eventTopicIcons';

interface EventTopicsSectionProps {
  items: EventTopicItem[];
  title?: string;
  titleAlignment?: 'left' | 'center' | 'right';
}

const EventTopicsSection: React.FC<EventTopicsSectionProps> = ({
  items,
  title = 'Event Topics',
  titleAlignment = 'center',
}) => {
  const { t } = useAdminTranslation('pageBuilder');
  const [activeTopic, setActiveTopic] = useState<EventTopicItem | null>(null);

  const titleAlignClass =
    titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center';
  const containerAlignClass =
    titleAlignment === 'left' ? 'items-start' : titleAlignment === 'right' ? 'items-end' : 'items-center';
  const isTitleArabic = isArabic(title);

  useEffect(() => {
    if (!activeTopic) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveTopic(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTopic]);

  if (items.length === 0) {
    return (
      <div
        className={`py-20 px-8 max-w-6xl mx-auto border-t border-slate-100 ${
          titleAlignment === 'left' ? 'text-left' : titleAlignment === 'right' ? 'text-right' : 'text-center'
        }`}
      >
        <h2
          className={`text-2xl font-bold text-slate-900 mb-2 ${titleAlignClass} flex items-center gap-3 ${
            isTitleArabic ? 'flex-row-reverse' : ''
          } ${titleAlignment === 'left' ? 'justify-start' : titleAlignment === 'right' ? 'justify-end' : 'justify-center'}`}
        >
          {isTitleArabic ? (
            <>
              <span>{title}</span>
              <Layers size={24} className="text-indigo-600" />
            </>
          ) : (
            <>
              <Layers size={24} className="text-indigo-600" />
              <span>{title}</span>
            </>
          )}
        </h2>
        <p className="text-slate-500">{t('edSecTopicsEmpty')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="py-24 px-8 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className={`flex flex-col ${containerAlignClass} mb-14`}>
            <h2
              className={`text-4xl font-bold text-slate-900 mb-4 ${titleAlignClass} flex items-center gap-3 ${
                isTitleArabic ? 'flex-row-reverse' : ''
              }`}
            >
              {isTitleArabic ? (
                <>
                  <span>{title}</span>
                  <Layers size={32} className="text-indigo-600 shrink-0" />
                </>
              ) : (
                <>
                  <Layers size={32} className="text-indigo-600 shrink-0" />
                  <span>{title}</span>
                </>
              )}
            </h2>
            <p className={`text-slate-500 max-w-2xl ${titleAlignClass}`}>{t('edSecTopicsIntro')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((topic) => {
              const Icon = resolveEventTopicIcon(topic.icon);
              const shortText = topic.shortDescription?.trim() || t('edSecTopicsNoShort');

              return (
                <article
                  key={topic.id}
                  className="group relative flex flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-md hover:bg-white min-h-[200px]"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Icon size={24} aria-hidden />
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTopic(topic)}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                      aria-label={t('edSecTopicsViewDetails', { name: topic.name || t('edTopicsUntitled') })}
                    >
                      <Eye size={20} />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                    {topic.name || t('edTopicsUntitled')}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 flex-1">{shortText}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {activeTopic ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-topic-modal-title"
          onClick={() => setActiveTopic(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200">
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  {React.createElement(resolveEventTopicIcon(activeTopic.icon), { size: 24 })}
                </div>
                <div className="min-w-0">
                  <h3 id="event-topic-modal-title" className="text-xl font-bold text-slate-900 truncate">
                    {activeTopic.name || t('edTopicsUntitled')}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTopic(null)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 shrink-0"
                aria-label={t('edSecTopicsCloseModal')}
              >
                <X size={22} />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {activeTopic.longDescription?.trim() || t('edSecTopicsNoLong')}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default EventTopicsSection;
