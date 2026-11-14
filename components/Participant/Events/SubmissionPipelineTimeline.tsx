import React from 'react';
import { CheckCircle2, Circle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { PipelineStepUi, PipelineStepStatusUi } from '../../../services/submissionPipelineService';

interface SubmissionPipelineTimelineProps {
  steps: PipelineStepUi[];
  compact?: boolean;
}

const statusIcon = (status: PipelineStepStatusUi) => {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="text-emerald-600 shrink-0" size={18} aria-hidden />;
    case 'rejected':
      return <XCircle className="text-red-500 shrink-0" size={18} aria-hidden />;
    case 'in_progress':
      return <Clock className="text-indigo-600 shrink-0" size={18} aria-hidden />;
    case 'waiting_review':
      return <AlertCircle className="text-amber-500 shrink-0" size={18} aria-hidden />;
    default:
      return <Circle className="text-slate-300 shrink-0" size={18} aria-hidden />;
  }
};

const statusLabel = (status: PipelineStepStatusUi): string => {
  switch (status) {
    case 'done':
      return 'Done';
    case 'rejected':
      return 'Rejected';
    case 'in_progress':
      return 'In progress';
    case 'waiting_review':
      return 'In review';
    default:
      return 'Upcoming';
  }
};

export const SubmissionPipelineTimeline: React.FC<SubmissionPipelineTimelineProps> = ({
  steps,
  compact,
}) => {
  if (!steps.length) return null;

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-slate-50/80 ${compact ? 'p-3' : 'p-4'} mb-3`}
      role="list"
      aria-label="Submission progress"
    >
      <p className={`text-xs font-medium text-slate-500 uppercase tracking-wide ${compact ? 'mb-2' : 'mb-3'}`}>
        Your submission progress
      </p>
      <ol className="space-y-0">
        {steps.map((step, i) => (
          <li key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center pt-0.5">
              {statusIcon(step.status)}
              {i < steps.length - 1 ? (
                <span
                  className={`w-px flex-1 min-h-[12px] ${
                    step.status === 'done' ? 'bg-emerald-200' : 'bg-slate-200'
                  }`}
                  aria-hidden
                />
              ) : null}
            </div>
            <div className={`min-w-0 flex-1 ${i < steps.length - 1 ? 'pb-3' : ''}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-900">{step.title}</span>
                <span className="text-[10px] font-medium uppercase text-slate-500 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                  {statusLabel(step.status)}
                </span>
              </div>
              {step.detail ? (
                <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>
              ) : null}
              {step.contributionSummary ? (
                <p className="mt-2 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1.5">
                  {step.contributionSummary}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default SubmissionPipelineTimeline;
