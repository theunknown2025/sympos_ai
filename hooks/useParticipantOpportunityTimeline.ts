import { useMemo } from 'react';
import type { FormSubmission, Opportunity, OpportunityApplication } from '../types';
import {
  buildOpportunityApplicationTimeline,
  type OpportunityPipelineStepUi,
} from '../services/opportunityPipelineService';

export function useParticipantOpportunityTimeline(
  opportunity: Opportunity,
  application: OpportunityApplication,
  stepSubmissions: FormSubmission[]
): { steps: OpportunityPipelineStepUi[] } {
  const steps = useMemo(
    () => buildOpportunityApplicationTimeline(opportunity, application, stepSubmissions),
    [opportunity, application, stepSubmissions]
  );
  return { steps };
}
