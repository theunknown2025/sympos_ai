import React from 'react';
import type { OpportunityPipelineStepUi } from '../../../services/opportunityPipelineService';

function segmentBarClass(status: OpportunityPipelineStepUi['status']): string {
  switch (status) {
    case 'done':
      return 'bg-emerald-500 text-white';
    case 'rejected':
      return 'bg-red-400 text-white';
    case 'in_progress':
      return 'bg-indigo-500 text-white';
    case 'waiting_review':
      return 'bg-amber-100 text-amber-950 border border-amber-300';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

interface OpportunityApplicationProgressBarProps {
  steps: OpportunityPipelineStepUi[];
}

const OpportunityApplicationProgressBar: React.FC<OpportunityApplicationProgressBarProps> = ({
  steps,
}) => {
  if (!steps.length) return null;

  return (
    <div className="w-full">
      <div className="flex gap-1 w-full">
        {steps.map((step) => (
          <div key={step.id} className="flex-1 min-w-0">
            <div
              className={`h-2 rounded-full ${segmentBarClass(step.status)}`}
              title={step.title}
            />
            <p className="text-[10px] text-slate-500 mt-1 truncate text-center">{step.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OpportunityApplicationProgressBar;
