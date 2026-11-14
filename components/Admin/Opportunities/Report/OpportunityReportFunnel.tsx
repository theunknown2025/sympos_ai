import React, { useMemo } from 'react';
import type { OpportunityReportFunnelStep } from './types';

interface OpportunityReportFunnelProps {
  steps: OpportunityReportFunnelStep[];
}

const OpportunityReportFunnel: React.FC<OpportunityReportFunnelProps> = ({ steps }) => {
  const maxTotal = useMemo(
    () => Math.max(1, ...steps.map((s) => s.totalCount)),
    [steps]
  );

  if (!steps.length) {
    return <p className="text-sm text-slate-500 text-center py-8">No process steps defined</p>;
  }

  return (
    <div className="space-y-3 w-full max-w-2xl mx-auto">
      <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-600 mb-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500" />
          Accepted (advanced)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500" />
          Rejected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-indigo-500" />
          In progress
        </span>
      </div>

      {steps.map((step) => {
        const widthPct = Math.max(36, Math.round((step.totalCount / maxTotal) * 100));
        const { acceptedCount, rejectedCount, pendingCount, totalCount } = step;

        return (
          <div key={step.key} className="flex flex-col items-center w-full">
            <p className="text-xs font-semibold text-slate-700 mb-1.5 text-center">
              Step {step.stepIndex + 1} · {step.title}
            </p>
            <div
              className="rounded-lg overflow-hidden shadow-md transition-all duration-300 min-h-[4.5rem]"
              style={{ width: `${widthPct}%` }}
            >
              {totalCount === 0 ? (
                <div className="h-full min-h-[4.5rem] flex items-center justify-center bg-slate-200 text-slate-500 text-sm">
                  No applications
                </div>
              ) : (
                <div className="flex w-full min-h-[4.5rem]">
                  {acceptedCount > 0 && (
                    <div
                      className="flex flex-col items-center justify-center py-2 px-1 bg-emerald-600 text-white min-w-[2.5rem]"
                      style={{ flex: acceptedCount }}
                      title={`${acceptedCount} accepted`}
                    >
                      <span className="text-lg sm:text-xl font-bold tabular-nums leading-none">
                        {acceptedCount}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wide opacity-90 mt-1">
                        accepted
                      </span>
                    </div>
                  )}
                  {rejectedCount > 0 && (
                    <div
                      className="flex flex-col items-center justify-center py-2 px-1 bg-red-500 text-white min-w-[2.5rem]"
                      style={{ flex: rejectedCount }}
                      title={`${rejectedCount} rejected`}
                    >
                      <span className="text-lg sm:text-xl font-bold tabular-nums leading-none">
                        {rejectedCount}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wide opacity-90 mt-1">
                        rejected
                      </span>
                    </div>
                  )}
                  {pendingCount > 0 && (
                    <div
                      className="flex flex-col items-center justify-center py-2 px-1 bg-indigo-600 text-white min-w-[2.5rem]"
                      style={{ flex: pendingCount }}
                      title={`${pendingCount} in progress`}
                    >
                      <span className="text-lg sm:text-xl font-bold tabular-nums leading-none">
                        {pendingCount}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wide opacity-90 mt-1">
                        in progress
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 tabular-nums">
              {totalCount} total · {acceptedCount} accepted · {rejectedCount} rejected
              {pendingCount > 0 ? ` · ${pendingCount} in progress` : ''}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default OpportunityReportFunnel;
