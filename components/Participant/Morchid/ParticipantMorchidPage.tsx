import React, { useState } from 'react';
import { Flower2, Languages } from 'lucide-react';
import type { MorchidLanguage } from '../../Admin/Morchid/types';
import { participantMorchidCopy, participantMorchidTopics } from './participantMorchidData';
import MorchidTopicCards from './MorchidTopicCards';
import { MORCHID_LANGUAGES, getMorchidLanguageLabel } from '../../Admin/Morchid/morchidLanguageLabels';

const ParticipantMorchidPage: React.FC = () => {
  const [language, setLanguage] = useState<MorchidLanguage>('en');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    participantMorchidTopics.en[0]?.id ?? null
  );

  const copy = participantMorchidCopy[language];
  const topics = participantMorchidTopics[language];
  const isRtl = language === 'ar';

  const handleSelectTopic = (id: string) => setSelectedTopicId(id);

  return (
    <div className="max-w-6xl mx-auto space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg">
            <Flower2 size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{copy.title}</h1>
            <p className="text-slate-600 mt-1 text-sm leading-relaxed">{copy.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 self-start">
          <Languages size={16} className="text-slate-400 mx-2" />
          {MORCHID_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                ${language === lang
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {getMorchidLanguageLabel(lang, copy)}
            </button>
          ))}
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{copy.topicGridTitle}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{copy.topicGridHint}</p>
        </div>
        <MorchidTopicCards
          topics={topics}
          selectedId={selectedTopicId}
          onSelect={handleSelectTopic}
          copy={copy}
          isRtl={isRtl}
          accentClass="border-violet-500 bg-violet-50"
        />
      </section>
    </div>
  );
};

export default ParticipantMorchidPage;
