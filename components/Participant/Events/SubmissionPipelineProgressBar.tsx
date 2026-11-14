import React from 'react';
import { Event, FormSubmission } from '../../../types';
import type {
  ParticipantSubmissionLaunchResult,
  ParticipantPipelineStepClickAction,
  PipelineStepId,
  PipelineStepStatusUi,
  PipelineStepUi,
} from '../../../services/submissionPipelineService';
import { resolveParticipantPipelineStepClickAction } from '../../../services/submissionPipelineService';

function segmentBarClass(status: PipelineStepStatusUi): string {
  switch (status) {
    case 'done':
      return 'bg-green-600 text-white';
    case 'rejected':
      return 'bg-red-500 text-white';
    case 'in_progress':
      return 'bg-blue-600 text-white';
    case 'waiting_review':
      return 'bg-amber-400 text-amber-950 border border-amber-500';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

function stepActionHint(action: ParticipantPipelineStepClickAction): string {
  switch (action.type) {
    case 'open_form':
      return 'Open form';
    case 'feedback':
      return 'View organizer feedback';
    case 'under_review':
      return 'View status';
    case 'info':
      return 'View details';
    default:
      return '';
  }
}

interface SubmissionPipelineProgressBarProps {
  steps: PipelineStepUi[];
  event: Event;
  /** Participant submission rows for this event (used to resolve click actions). */
  subs: FormSubmission[];
  launch: ParticipantSubmissionLaunchResult;
  selectedStepId?: PipelineStepId | null;
  onStepClick?: (stepId: PipelineStepId, action: ParticipantPipelineStepClickAction) => void;
}

/**
 * Horizontal submission pipeline steps (abstract → article → payment → program).
 */
const SubmissionPipelineProgressBar: React.FC<SubmissionPipelineProgressBarProps> = ({
  steps,
  event,
  subs,
  launch,
  selectedStepId = null,
  onStepClick,
}) => {
  if (!steps.length) return null;

  return (
    <div className="mb-1" aria-label="Submission pipeline progress">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Steps</p>
      <div
        className="grid w-full gap-1 sm:gap-2 items-stretch"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, i) => {
          const action = resolveParticipantPipelineStepClickAction(event, subs, step, launch);
          const interactive = Boolean(onStepClick);
          const isSelected = selectedStepId === step.id;
          return (
            <div key={`${step.id}-${i}`} className="min-w-0">
              <button
                type="button"
                disabled={!interactive}
                onClick={() => interactive && onStepClick?.(step.id, action)}
                className={`w-full min-w-0 rounded-lg border text-left transition-all ${
                  interactive
                    ? 'cursor-pointer shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-400'
                    : 'cursor-default border-transparent opacity-95'
                } ${segmentBarClass(step.status)} ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-blue-600 border-blue-800/30'
                    : interactive
                      ? 'ring-1 ring-white/30'
                      : ''
                }`}
                title={
                  interactive
                    ? `${step.title} — ${stepActionHint(action)}`
                    : `${step.title} — ${step.status === 'done' ? 'Complete' : step.status === 'upcoming' ? 'Locked' : step.status.replace('_', ' ')}`
                }
              >
                <div className="px-2 py-2 sm:px-3 sm:py-2.5">
                  <div className="text-[10px] sm:text-xs font-semibold text-center sm:text-left line-clamp-2 leading-tight drop-shadow-sm">
                    {step.title}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500 mt-2">
        {launch.outcome === 'open'
          ? 'Tap a step to preview your answers, read organizer feedback, or open the form.'
          : 'Tap a step to preview your submission and see status details.'}
      </p>
    </div>
  );
};

export default SubmissionPipelineProgressBar;
