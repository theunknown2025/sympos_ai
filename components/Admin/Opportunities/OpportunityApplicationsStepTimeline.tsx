import React, { useMemo } from 'react';
import type { OpportunityStep } from '../../../types';
import { formatOpportunityStepDate } from '../../../utils/opportunityStepDate';
import { resolveOpportunityStepsSectionTitle } from '../../../utils/opportunityStepsSectionTitle';

export interface ApplicationStepTimelineItem {
  key: string;
  stepIndex: number | null;
  title: string;
  count: number;
  step?: OpportunityStep | null;
}

interface OpportunityApplicationsStepTimelineProps {
  items: ApplicationStepTimelineItem[];
  selectedKey: string;
  onSelectStep: (key: string) => void;
  sectionTitle?: string;
  className?: string;
}

const TRACK_TOP = '2.75rem';

/**
 * Clickable horizontal process timeline for organizer application review.
 */
const OpportunityApplicationsStepTimeline: React.FC<OpportunityApplicationsStepTimelineProps> = ({
  items,
  selectedKey,
  onSelectStep,
  sectionTitle,
  className = '',
}) => {
  const selectedIndex = useMemo(
    () => Math.max(0, items.findIndex((i) => i.key === selectedKey)),
    [items, selectedKey]
  );

  if (!items.length) return null;

  const progressPercent =
    items.length <= 1 ? 100 : (selectedIndex / (items.length - 1)) * 100;

  return (
    <div className={className} aria-label="Process timeline">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
        {resolveOpportunityStepsSectionTitle(sectionTitle)}
      </p>

      <div className="rounded-xl border border-slate-200/80 bg-white px-2 sm:px-4 py-5 shadow-sm">
        <div className="relative w-full min-w-0">
          {/* Base track */}
          <div
            className="absolute left-[8%] right-[8%] h-[3px] rounded-full bg-slate-200"
            style={{ top: TRACK_TOP }}
            aria-hidden
          />
          {/* Active track to selected step */}
          <div
            className="absolute left-[8%] h-[3px] rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
            style={{
              top: TRACK_TOP,
              width: `${Math.max(8, progressPercent * 0.84)}%`,
            }}
            aria-hidden
          />

          <ol
            className="relative grid w-full list-none m-0 p-0 gap-0"
            style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
          >
            {items.map((item, index) => {
              const dateLabel = item.step ? formatOpportunityStepDate(item.step.date) : null;
              const selected = selectedKey === item.key;
              const hasApps = item.count > 0;
              const isMetaStep = item.stepIndex == null;

              return (
                <li key={item.key} className="min-w-0 flex justify-center">
                  <button
                    type="button"
                    onClick={() => onSelectStep(item.key)}
                    className={`group relative flex flex-col items-center w-full max-w-[9.5rem] px-1 pb-1 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                      selected ? 'bg-indigo-50/90' : 'hover:bg-slate-50'
                    }`}
                  >
                    {dateLabel ? (
                      <span className="text-[11px] font-medium text-indigo-600 tabular-nums mb-2 min-h-[1rem]">
                        {dateLabel}
                      </span>
                    ) : (
                      <span className="mb-2 min-h-[1rem]" aria-hidden />
                    )}

                    <span
                      className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full border-[3px] border-white shadow-md transition-transform ${
                        selected
                          ? 'bg-indigo-600 scale-110 shadow-indigo-200'
                          : hasApps
                            ? 'bg-indigo-400 group-hover:bg-indigo-500'
                            : 'bg-slate-300 group-hover:bg-slate-400'
                      }`}
                      aria-hidden
                    >
                      {selected ? (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      ) : null}
                    </span>

                    <span
                      className={`mt-3 text-[10px] font-bold uppercase tracking-wide ${
                        selected ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    >
                      {isMetaStep ? 'Status' : `Step ${item.stepIndex + 1}`}
                    </span>
                    <span
                      className={`mt-0.5 text-sm font-semibold text-center leading-snug line-clamp-2 w-full px-0.5 ${
                        selected ? 'text-indigo-950' : 'text-slate-800'
                      }`}
                    >
                      {item.title}
                    </span>

                    <span
                      className={`mt-2 text-xs font-semibold tabular-nums px-2.5 py-1 rounded-full ${
                        selected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : hasApps
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.count} {item.count === 1 ? 'application' : 'applications'}
                    </span>

                    {selected ? (
                      <span
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-indigo-600"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default OpportunityApplicationsStepTimeline;
