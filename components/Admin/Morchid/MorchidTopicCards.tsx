import React from 'react';
import type { MorchidPageCopy, MorchidTopic } from './types';
import MorchidGuideAccordion from './MorchidGuideAccordion';

interface MorchidTopicCardsProps {
  topics: MorchidTopic[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  copy: MorchidPageCopy;
  isRtl?: boolean;
  accentClass?: string;
}

const MorchidTopicCards: React.FC<MorchidTopicCardsProps> = ({
  topics,
  selectedId,
  onSelect,
  copy,
  isRtl = false,
  accentClass = 'border-indigo-500 bg-indigo-50',
}) => {
  const selectedTopic = topics.find((t) => t.id === selectedId) ?? null;

  return (
    <div
      className={`flex flex-col lg:flex-row gap-6 ${isRtl ? 'lg:flex-row-reverse' : ''}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="lg:w-80 shrink-0 flex flex-col gap-2.5 max-h-[70vh] overflow-y-auto pr-1">
        {topics.map((topic) => {
          const Icon = topic.icon;
          const isSelected = selectedId === topic.id;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onSelect(topic.id)}
              className={`w-full flex flex-col items-start gap-2 p-4 rounded-2xl border-2 transition-all text-left
                ${isSelected
                  ? `${accentClass} shadow-md`
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 hover:shadow-sm'
                }`}
            >
              <div className="flex items-center gap-3 w-full">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${topic.color}`}
                >
                  <Icon size={20} className={topic.iconColor} />
                </div>
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {topic.title}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 w-full">
                {topic.shortDescription}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-w-0">
        {selectedTopic ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${selectedTopic.color}`}
              >
                <selectedTopic.icon size={22} className={selectedTopic.iconColor} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedTopic.title}</h3>
                <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                  {selectedTopic.shortDescription}
                </p>
              </div>
            </div>
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              {copy.guidelinesTitle}
            </h4>
            <MorchidGuideAccordion
              guidelines={selectedTopic.guidelines}
              stepLabel={copy.stepLabel}
              tipLabel={copy.tipLabel}
              isRtl={isRtl}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[200px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-400 px-6 text-center">{copy.selectTopicHint}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MorchidTopicCards;
