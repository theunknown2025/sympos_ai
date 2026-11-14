import React, { useMemo } from 'react';
import type { OpportunityStep } from '../../../types';
import { formatOpportunityStepDate } from '../../../utils/opportunityStepDate';
import { resolveOpportunityStepsSectionTitle } from '../../../utils/opportunityStepsSectionTitle';

interface OpportunityProcessTimelineProps {
  steps: OpportunityStep[];
  sectionTitle?: string;
  className?: string;
  /** When true, hides the section if there are no named steps. */
  hideWhenEmpty?: boolean;
}

/**
 * Horizontal process timeline for opportunity steps (preview / participant-facing).
 */
const OpportunityProcessTimeline: React.FC<OpportunityProcessTimelineProps> = ({
  steps,
  sectionTitle,
  className = '',
  hideWhenEmpty = true,
}) => {
  const sorted = useMemo(
    () => [...steps].sort((a, b) => a.order - b.order).filter((s) => s.name.trim()),
    [steps]
  );

  if (hideWhenEmpty && sorted.length === 0) return null;

  return (
    <div className={className} aria-label="Application process">
      <p className="text-sm font-semibold text-slate-900 mb-3">
        {resolveOpportunityStepsSectionTitle(sectionTitle)}
      </p>
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <ol className="flex items-start min-w-max list-none m-0 p-0">
          {sorted.map((step, index) => {
            const dateLabel = formatOpportunityStepDate(step.date);
            const isLast = index === sorted.length - 1;
            return (
              <li key={step.id} className="flex items-start">
                <div className="flex flex-col items-center w-[6.5rem] sm:w-[7.5rem] shrink-0 px-0.5">
                  <span
                    className={`text-[11px] font-medium tabular-nums min-h-[1.125rem] text-center w-full ${
                      dateLabel ? 'text-indigo-600' : 'text-transparent select-none'
                    }`}
                    aria-hidden={!dateLabel}
                  >
                    {dateLabel || '·'}
                  </span>
                  <div
                    className="mt-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-100 shrink-0"
                    aria-hidden
                  />
                  <span className="mt-2 text-xs font-semibold text-slate-900 text-center leading-tight line-clamp-3 w-full">
                    {step.name}
                  </span>
                  {step.description?.trim() ? (
                    <span className="mt-1 text-[10px] text-slate-500 text-center leading-snug line-clamp-2 w-full">
                      {step.description}
                    </span>
                  ) : null}
                </div>
                {!isLast ? (
                  <div
                    className="w-6 sm:w-10 h-0.5 bg-indigo-200 shrink-0 mt-[1.35rem]"
                    aria-hidden
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400 italic">Process steps will appear here…</p>
      ) : null}
    </div>
  );
};

export default OpportunityProcessTimeline;
