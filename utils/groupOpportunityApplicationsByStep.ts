import type { Opportunity, OpportunityApplication, OpportunityStep } from '../types';
import { sortedOpportunitySteps } from '../services/opportunityService';

export interface OpportunityApplicationStepGroup {
  key: string;
  stepIndex: number | null;
  step: OpportunityStep | null;
  title: string;
  applications: OpportunityApplication[];
}

function applicationBucketStepIndex(app: OpportunityApplication): number | 'completed' {
  if (app.status === 'completed') return 'completed';
  if (app.status === 'rejected') {
    return app.rejectedAtStepIndex ?? app.currentStepIndex;
  }
  return app.currentStepIndex;
}

/**
 * Groups organizer applications under each opportunity process step (plus Completed).
 */
export function groupApplicationsByProcessStep(
  opportunity: Opportunity,
  applications: OpportunityApplication[]
): OpportunityApplicationStepGroup[] {
  const steps = sortedOpportunitySteps(opportunity);
  const groups: OpportunityApplicationStepGroup[] = [];

  if (steps.length === 0) {
    return [
      {
        key: 'step-0',
        stepIndex: 0,
        step: null,
        title: 'Applications',
        applications: [...applications],
      },
    ];
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const inBucket = applications.filter((app) => applicationBucketStepIndex(app) === i);
    groups.push({
      key: `step-${i}`,
      stepIndex: i,
      step,
      title: step.name.trim() || `Step ${i + 1}`,
      applications: inBucket,
    });
  }

  const completed = applications.filter((app) => app.status === 'completed');
  if (completed.length > 0) {
    groups.push({
      key: 'completed',
      stepIndex: null,
      step: null,
      title: 'Completed',
      applications: completed,
    });
  }

  return groups;
}
