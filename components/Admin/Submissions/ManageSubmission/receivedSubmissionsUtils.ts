import { Event, FormSubmission } from '../../../../types';
import {
  eventSubmissionPreset,
  workflowNeedsAbstract,
  workflowNeedsPayment,
  submissionBelongsToEvent,
} from '../../../../services/submissionPipelineService';
import { isArticleRowThroughReviewGate } from '../../../../services/participantArticleEvaluationService';

export type ReceivedScenarioTabId = 'abstract' | 'article';

/**
 * Map a submission to exactly one event when the same submission form is used on several events.
 * Prefers stored event UUID, then acceptedEventId, then an unambiguous landing-page id match.
 * Returns null if the row cannot be tied to a single event (avoids showing it under the wrong event).
 */
export function resolveSubmissionEvent(
  submission: FormSubmission,
  userEvents: Event[]
): Event | null {
  const eventsWithForm = userEvents.filter((event) => {
    const inArticle =
      event.submissionFormIds && event.submissionFormIds.length > 0
        ? event.submissionFormIds.includes(submission.formId)
        : Boolean((event as unknown as { submissionFormId?: string }).submissionFormId === submission.formId);
    const inAbstract =
      event.abstractSubmissionFormIds && event.abstractSubmissionFormIds.length > 0
        ? event.abstractSubmissionFormIds.includes(submission.formId)
        : false;
    const inPayment =
      Boolean(event.submissionPaymentFormId) && event.submissionPaymentFormId === submission.formId;
    return inArticle || inAbstract || inPayment;
  });
  if (eventsWithForm.length === 0) return null;

  const byStoredEventId = eventsWithForm.find((e) => e.id === submission.eventId);
  if (byStoredEventId) return byStoredEventId;

  if (submission.acceptedEventId) {
    const byAccepted = eventsWithForm.find((e) => e.id === submission.acceptedEventId);
    if (byAccepted) return byAccepted;
  }

  const landingHits = eventsWithForm.filter(
    (e) => Array.isArray(e.landingPageIds) && e.landingPageIds.includes(submission.eventId)
  );
  if (landingHits.length === 1) return landingHits[0];
  if (landingHits.length > 1) {
    if (submission.acceptedEventId) {
      const resolved = landingHits.find((e) => e.id === submission.acceptedEventId);
      if (resolved) return resolved;
    }
    return null;
  }

  return null;
}

export function isAbstractSubmission(submission: FormSubmission, event: Event): boolean {
  return (
    Boolean(event.abstractSubmissionFormIds?.includes(submission.formId)) ||
    submission.submissionPipelineKind === 'abstract'
  );
}

export function isArticleSubmission(submission: FormSubmission, event: Event): boolean {
  if (isAbstractSubmission(submission, event)) return false;
  if (event.submissionPaymentFormId && submission.formId === event.submissionPaymentFormId) return false;
  const legacyId = (event as unknown as { submissionFormId?: string }).submissionFormId;
  return Boolean(
    event.submissionFormIds?.includes(submission.formId) || legacyId === submission.formId
  );
}

/** Linked abstract row for an article submission (presets C/D), when discoverable from `allSubs`. */
export function findAbstractRowForArticle(
  article: FormSubmission,
  event: Event,
  allSubs: FormSubmission[]
): FormSubmission | undefined {
  if (article.parentSubmissionId) {
    const byParent = allSubs.find(
      (s) => s.id === article.parentSubmissionId && isAbstractSubmission(s, event)
    );
    if (byParent) return byParent;
  }
  return allSubs.find(
    (s) =>
      isAbstractSubmission(s, event) &&
      Boolean(s.submissionPipelineGroupId) &&
      Boolean(article.submissionPipelineGroupId) &&
      s.submissionPipelineGroupId === article.submissionPipelineGroupId &&
      (s.participantUserId || '') === (article.participantUserId || '')
  );
}

export function abstractAcceptedForArticleRow(
  article: FormSubmission,
  event: Event,
  allSubs: FormSubmission[]
): boolean {
  if (!workflowNeedsAbstract(eventSubmissionPreset(event))) return true;
  const abstractRow = findAbstractRowForArticle(article, event, allSubs);
  return abstractRow?.decisionStatus === 'accepted';
}

export function submissionMatchesReceivedTab(
  submission: FormSubmission,
  event: Event,
  tab: ReceivedScenarioTabId
): boolean {
  if (tab === 'abstract') return isAbstractSubmission(submission, event);
  return isArticleSubmission(submission, event);
}

/** Accepted article submissions on events whose workflow includes payment (presets B / D). */
export function submissionIsPaymentEligible(
  submission: FormSubmission,
  event: Event,
  allSubs?: FormSubmission[]
): boolean {
  if (!isArticleSubmission(submission, event) || !workflowNeedsPayment(eventSubmissionPreset(event))) {
    return false;
  }
  const abstractOk =
    allSubs !== undefined ? abstractAcceptedForArticleRow(submission, event, allSubs) : undefined;
  return isArticleRowThroughReviewGate(submission, event, abstractOk);
}

/** Payment pipeline row linked to an accepted article (parent_submission_id, or legacy group + participant match). */
export function findPaymentFormSubmissionForArticle(
  article: FormSubmission,
  event: Event,
  allSubs: FormSubmission[]
): FormSubmission | undefined {
  const fid = event.submissionPaymentFormId;
  if (!fid) return undefined;
  return allSubs.find((p) => {
    if (p.formId !== fid || p.submissionPipelineKind !== 'payment') return false;
    if (p.parentSubmissionId === article.id) return true;
    if (
      !p.parentSubmissionId &&
      article.submissionPipelineGroupId &&
      p.submissionPipelineGroupId === article.submissionPipelineGroupId &&
      (p.participantUserId || '') === (article.participantUserId || '')
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Article submissions that may be placed on the conference program: accepted full paper,
 * and for the event's workflow preset, all prior required steps are satisfied (abstract accepted
 * when C/D; organizer payment confirmation when B/D).
 */
export function filterSubmissionsEligibleForProgram(
  event: Event,
  submissions: FormSubmission[]
): FormSubmission[] {
  const preset = eventSubmissionPreset(event);
  const needAbstract = workflowNeedsAbstract(preset);
  const needPay = workflowNeedsPayment(preset);

  return submissions.filter((sub) => {
    if (!submissionBelongsToEvent(sub, event)) return false;
    if (!isArticleSubmission(sub, event)) return false;
    const abstractOk = abstractAcceptedForArticleRow(sub, event, submissions);
    if (!isArticleRowThroughReviewGate(sub, event, abstractOk)) return false;

    if (needAbstract) {
      const abstractRow = findAbstractRowForArticle(sub, event, submissions);
      if (!abstractRow || abstractRow.decisionStatus !== 'accepted') return false;
    }

    if (needPay && !sub.submissionPaymentCompleted) return false;

    return true;
  });
}

export function getReceivedScenarioTabs(event: Event): Array<{ id: ReceivedScenarioTabId; label: string }> {
  const preset = eventSubmissionPreset(event);
  const tabs: Array<{ id: ReceivedScenarioTabId; label: string }> = [];
  if (workflowNeedsAbstract(preset)) {
    tabs.push({ id: 'abstract', label: 'Received abstracts' });
  }
  tabs.push({ id: 'article', label: 'Received articles' });
  return tabs;
}

export function defaultReceivedTabForEvent(event: Event): ReceivedScenarioTabId {
  const tabs = getReceivedScenarioTabs(event);
  return tabs[0]?.id ?? 'article';
}

/** Event has at least one form used for submissions (article, abstract, or legacy single id). */
export function eventHasSubmissionForms(event: Event): boolean {
  return Boolean(
    (event.submissionFormIds && event.submissionFormIds.length > 0) ||
      (event as unknown as { submissionFormId?: string }).submissionFormId ||
      (event.abstractSubmissionFormIds && event.abstractSubmissionFormIds.length > 0)
  );
}
