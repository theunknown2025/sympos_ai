import React from 'react';
import { Check } from 'lucide-react';
import type { AiPosterStep } from './types';

type AiPosterStepIndicatorProps = {
  step: AiPosterStep;
  onStepChange: (step: AiPosterStep) => void;
  canGoStep2: boolean;
};

const STEPS: { id: AiPosterStep; label: string; hint: string }[] = [
  { id: 1, label: 'General Information', hint: 'Content & assets' },
  { id: 2, label: 'Generate with AI', hint: 'OpenAI poster' },
];

const AiPosterStepIndicator: React.FC<AiPosterStepIndicatorProps> = ({
  step,
  onStepChange,
  canGoStep2,
}) => (
  <div className="flex gap-2">
    {STEPS.map((item) => {
      const active = step === item.id;
      const done = step > item.id;
      const disabled = item.id === 2 && !canGoStep2;
      return (
        <button
          key={item.id}
          type="button"
          disabled={disabled}
          onClick={() => onStepChange(item.id)}
          className={`flex-1 rounded-lg border px-2.5 py-2 text-left transition-colors ${
            active
              ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
              : done
                ? 'border-emerald-200 bg-emerald-50/60'
                : 'border-slate-200 bg-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-300'}`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                done
                  ? 'bg-emerald-600 text-white'
                  : active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-600'
              }`}
            >
              {done ? <Check size={12} /> : item.id}
            </span>
            <span className="text-xs font-semibold text-slate-800">{item.label}</span>
          </div>
          <p className="mt-0.5 pl-6 text-[10px] text-slate-500">{item.hint}</p>
        </button>
      );
    })}
  </div>
);

export default AiPosterStepIndicator;
