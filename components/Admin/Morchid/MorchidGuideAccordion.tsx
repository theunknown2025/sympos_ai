import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import type { MorchidGuideline } from './types';

interface MorchidGuideAccordionProps {
  guidelines: MorchidGuideline[];
  stepLabel: string;
  tipLabel: string;
  isRtl?: boolean;
}

const MorchidGuideAccordion: React.FC<MorchidGuideAccordionProps> = ({
  guidelines,
  stepLabel,
  tipLabel,
  isRtl = false,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="space-y-2" dir={isRtl ? 'rtl' : 'ltr'}>
      {guidelines.map((guideline, index) => {
        const isOpen = expandedIndex === index;
        return (
          <div
            key={guideline.title}
            className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setExpandedIndex(isOpen ? null : index)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              {isOpen ? (
                <ChevronDown size={18} className="text-indigo-500 shrink-0" />
              ) : (
                <ChevronRight size={18} className="text-slate-400 shrink-0" />
              )}
              <span className="flex-1 text-sm font-semibold text-slate-900">
                {guideline.title}
              </span>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">
                {index + 1}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 py-4 border-t border-slate-100">
                <ol className="space-y-2.5">
                  {guideline.steps.map((step, stepIndex) => (
                    <li key={step} className="flex gap-3 text-sm text-slate-700">
                      <span className="shrink-0 w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                        {stepIndex + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">
                        <span className="sr-only">{stepLabel} </span>
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
                {guideline.tip && (
                  <div className="mt-4 flex gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900 leading-relaxed">
                      <span className="font-semibold">{tipLabel}: </span>
                      {guideline.tip}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MorchidGuideAccordion;
