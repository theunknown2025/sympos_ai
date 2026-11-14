import type { Event, FormSubmission } from '../types';
import { eventUsesArticleReviewPipeline } from '../services/participantArticleEvaluationService';
import { submissionBelongsToEvent } from '../services/submissionPipelineService';
import { isArticleSubmissionForEvent } from '../services/submissionBadgeService';

/** Accepted registration form row (not article/abstract/payment pipeline). */
export function isRegistrationCheckinRow(sub: FormSubmission, event: Event | undefined): boolean {
  if (!event || !submissionBelongsToEvent(sub, event)) return false;
  const regIds = event.registrationFormIds ?? [];
  if (!regIds.includes(sub.formId)) return false;
  if (
    sub.submissionPipelineKind === 'article' ||
    sub.submissionPipelineKind === 'abstract' ||
    sub.submissionPipelineKind === 'payment'
  ) {
    return false;
  }
  if (isArticleSubmissionForEvent(sub, event)) return false;
  return sub.approvalStatus === 'accepted';
}

/** Accepted article / presenter row for submission check-in. */
export function isSubmissionCheckinRow(sub: FormSubmission, event: Event | undefined): boolean {
  if (!event || !submissionBelongsToEvent(sub, event)) return false;
  if (!isArticleSubmissionForEvent(sub, event)) return false;
  if (sub.decisionStatus !== 'accepted') return false;
  if (eventUsesArticleReviewPipeline(event)) {
    return sub.approvalStatus === 'accepted';
  }
  return true;
}

export function resolveEventForSubmission(sub: FormSubmission, events: Event[]): Event | undefined {
  const key = sub.acceptedEventId || sub.eventId;
  return events.find((e) => e.id === key);
}
