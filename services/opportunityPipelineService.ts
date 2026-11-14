import type { FormSubmission, Opportunity, OpportunityApplication } from '../types';
import { formatOpportunityStepDate } from '../utils/opportunityStepDate';
import { sortedOpportunitySteps } from './opportunityService';

function stepDetailLine(description?: string, date?: string): string | undefined {
  const parts: string[] = [];
  const dateLabel = formatOpportunityStepDate(date);
  if (dateLabel) parts.push(dateLabel);
  if (description?.trim()) parts.push(description.trim());
  return parts.length ? parts.join(' · ') : undefined;
}

export type OpportunityPipelineStepStatusUi =
  | 'upcoming'
  | 'in_progress'
  | 'done'
  | 'rejected'
  | 'waiting_review';

export interface OpportunityPipelineStepUi {
  id: string;
  title: string;
  status: OpportunityPipelineStepStatusUi;
  detail?: string;
}

export function buildOpportunityApplicationTimeline(
  opportunity: Opportunity,
  application: OpportunityApplication,
  stepSubmissions: FormSubmission[]
): OpportunityPipelineStepUi[] {
  const steps = sortedOpportunitySteps(opportunity);
  const submissionByIndex = new Map<number, FormSubmission>();
  for (const sub of stepSubmissions) {
    if (sub.opportunityStepIndex != null) {
      submissionByIndex.set(sub.opportunityStepIndex, sub);
    }
  }

  if (application.status === 'rejected') {
    return steps.map((step, index) => {
      const rejectedAt = application.rejectedAtStepIndex ?? application.currentStepIndex;
      let status: OpportunityPipelineStepStatusUi = 'upcoming';
      if (index < rejectedAt) status = 'done';
      else if (index === rejectedAt) status = 'rejected';
      return {
        id: step.id,
        title: step.name,
        status,
        detail: stepDetailLine(step.description, step.date),
      };
    });
  }

  if (application.status === 'completed') {
    return steps.map((step) => ({
      id: step.id,
      title: step.name,
      status: 'done' as OpportunityPipelineStepStatusUi,
      detail: stepDetailLine(step.description, step.date),
    }));
  }

  return steps.map((step, index) => {
    let status: OpportunityPipelineStepStatusUi = 'upcoming';
    if (index < application.currentStepIndex) {
      status = 'done';
    } else if (index === application.currentStepIndex) {
      const hasSub = submissionByIndex.has(index);
      status = hasSub ? 'waiting_review' : 'in_progress';
    }
    return {
      id: step.id,
      title: step.name,
      status,
      detail: stepDetailLine(step.description, step.date),
    };
  });
}

export function participantCanSubmitCurrentStep(
  application: OpportunityApplication,
  stepSubmissions: FormSubmission[]
): boolean {
  if (application.status !== 'in_progress') return false;
  const hasCurrent = stepSubmissions.some(
    (s) => s.opportunityStepIndex === application.currentStepIndex
  );
  return !hasCurrent;
}
