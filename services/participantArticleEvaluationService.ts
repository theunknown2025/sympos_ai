import type { Event, FormSubmission, SubmissionModificationRound } from '../types';

/** Event runs abstract/article + committee evaluation before final approval and payment. */
export function eventUsesArticleReviewPipeline(event: Event): boolean {
  return (event.evaluationFormIds?.length ?? 0) > 0 || event.evaluationEnabled === true;
}

/**
 * Article must go through dispatch → evaluation → final approval before payment / downstream steps.
 * True for submission-payment presets (B, D) or when evaluation is enabled on the event.
 */
export function requiresFullArticlePostAcceptPath(event: Event): boolean {
  const p = event.submissionWorkflowPreset ?? 'A';
  if (p === 'B' || p === 'D') return true;
  return eventUsesArticleReviewPipeline(event);
}

export type ArticleEvalMicroStatus =
  | 'upcoming'
  | 'in_progress'
  | 'done'
  | 'rejected'
  | 'waiting_review'
  /** Event has no committee review; these stages are not used (shown muted). */
  | 'not_applicable';

export interface ArticleEvalMicroStep {
  id: 'received' | 'accepted' | 'dispatched' | 'modifications' | 'evaluated' | 'approved';
  title: string;
  status: ArticleEvalMicroStatus;
}

export interface ModificationPipelineSummary {
  hasRounds: boolean;
  needsParticipantAction: boolean;
  isBlockingEvaluation: boolean;
  stepStatus: ArticleEvalMicroStatus;
}

const TERMINAL_ROUND_STATUSES = new Set(['reviewer_approved', 'rejected_all']);

export function deriveModificationPipelineSummary(
  rounds: SubmissionModificationRound[]
): ModificationPipelineSummary {
  const hasRounds = rounds.length > 0;
  const needsParticipantAction = rounds.some((r) => r.status === 'awaiting_participant');
  const isBlockingEvaluation = rounds.some((r) =>
    ['pending_organizer', 'awaiting_participant', 'participant_submitted'].includes(r.status)
  );

  let stepStatus: ArticleEvalMicroStatus = 'upcoming';
  if (needsParticipantAction) {
    stepStatus = 'in_progress';
  } else if (rounds.some((r) => r.status === 'pending_organizer' || r.status === 'participant_submitted')) {
    stepStatus = 'waiting_review';
  } else if (hasRounds && rounds.every((r) => TERMINAL_ROUND_STATUSES.has(r.status))) {
    stepStatus = 'done';
  } else if (!hasRounds) {
    stepStatus = 'not_applicable';
  }

  return { hasRounds, needsParticipantAction, isBlockingEvaluation, stepStatus };
}

/**
 * Six-step article track: **Received → Accepted → Dispatched → Modifications → Evaluated → Approved**.
 * When **neither** payment (B/D) **nor** evaluation is required, post-accept steps are `not_applicable`.
 */
export function buildArticleLifecycleMicroSteps(
  event: Event,
  article: FormSubmission | undefined,
  abstractAccepted: boolean,
  modificationRounds: SubmissionModificationRound[] = []
): ArticleEvalMicroStep[] {
  const modSummary = deriveModificationPipelineSummary(modificationRounds);
  const strictPostAccept = requiresFullArticlePostAcceptPath(event);
  const needsAbstractPreset =
    event.submissionWorkflowPreset === 'C' || event.submissionWorkflowPreset === 'D';

  const received: ArticleEvalMicroStatus = !article
    ? abstractAccepted
      ? 'in_progress'
      : 'upcoming'
    : needsAbstractPreset && !abstractAccepted
      ? 'waiting_review'
      : 'done';

  let accepted: ArticleEvalMicroStatus = 'upcoming';
  if (article) {
    if (article.decisionStatus === 'rejected') accepted = 'rejected';
    else if (article.decisionStatus === 'accepted') accepted = 'done';
    else if (article.decisionStatus === 'reserved') accepted = 'in_progress';
    else accepted = 'waiting_review';
  }

  let dispatched: ArticleEvalMicroStatus = 'upcoming';
  let modifications: ArticleEvalMicroStatus = 'upcoming';
  let evaluated: ArticleEvalMicroStatus = 'upcoming';
  let approved: ArticleEvalMicroStatus = 'upcoming';

  if (!strictPostAccept) {
    if (article?.decisionStatus === 'rejected') {
      dispatched = 'upcoming';
      modifications = 'upcoming';
      evaluated = 'upcoming';
      approved = 'upcoming';
    } else if (article?.decisionStatus === 'accepted') {
      dispatched = 'not_applicable';
      modifications = 'not_applicable';
      evaluated = 'not_applicable';
      approved = 'not_applicable';
    } else {
      dispatched = 'upcoming';
      modifications = 'upcoming';
      evaluated = 'upcoming';
      approved = 'upcoming';
    }
  } else if (article?.decisionStatus === 'rejected') {
    dispatched = 'upcoming';
    modifications = 'upcoming';
    evaluated = 'upcoming';
    approved = 'upcoming';
  } else if (article?.decisionStatus === 'accepted') {
    const ds = article.dispatchingStatus;
    if (ds === 'dispatched' || ds === 'in_review' || ds === 'completed') dispatched = 'done';
    else dispatched = 'waiting_review';

    if (dispatched === 'upcoming' || dispatched === 'waiting_review') {
      modifications = 'upcoming';
    } else if (modSummary.hasRounds) {
      modifications = modSummary.stepStatus;
    } else {
      modifications = 'not_applicable';
    }

    if (modSummary.isBlockingEvaluation) {
      evaluated = modifications === 'in_progress' ? 'upcoming' : 'waiting_review';
    } else if (ds === 'completed') {
      evaluated = 'done';
    } else if (ds === 'in_review') {
      evaluated = 'in_progress';
    } else if (ds === 'dispatched') {
      evaluated = 'waiting_review';
    } else {
      evaluated = 'upcoming';
    }

    if (article.approvalStatus === 'rejected') approved = 'rejected';
    else if (article.approvalStatus === 'reserved') approved = 'in_progress';
    else if (article.approvalStatus === 'accepted') approved = 'done';
    else if (ds === 'completed' && !modSummary.isBlockingEvaluation) approved = 'waiting_review';
    else approved = 'upcoming';
  }

  return [
    { id: 'received', title: 'Received', status: received },
    { id: 'accepted', title: 'Accepted', status: accepted },
    { id: 'dispatched', title: 'Dispatched', status: dispatched },
    { id: 'modifications', title: 'Modifications', status: modifications },
    { id: 'evaluated', title: 'Evaluated', status: evaluated },
    { id: 'approved', title: 'Approved', status: approved },
  ];
}

/** @deprecated Use `buildArticleLifecycleMicroSteps`. */
export function buildArticleEvaluationMicroSteps(
  event: Event,
  article: FormSubmission | undefined,
  abstractAccepted: boolean,
  modificationRounds: SubmissionModificationRound[] = []
): ArticleEvalMicroStep[] {
  return buildArticleLifecycleMicroSteps(event, article, abstractAccepted, modificationRounds);
}

function inferAbstractAcceptedForArticleGate(article: FormSubmission, event: Event): boolean {
  const preset = event.submissionWorkflowPreset ?? 'A';
  if (preset !== 'C' && preset !== 'D') return true;
  return Boolean(article.parentSubmissionId);
}

/**
 * Every article pipeline step is terminal (`done` or `not_applicable`).
 * Use this for payment and “pipeline complete” so activation matches the article pipeline UI.
 */
export function isArticleLifecycleCompleteForPayment(
  article: FormSubmission | undefined,
  event: Event,
  abstractAccepted?: boolean
): boolean {
  if (!article) return false;
  const abs =
    abstractAccepted !== undefined ? abstractAccepted : inferAbstractAcceptedForArticleGate(article, event);
  const steps = buildArticleLifecycleMicroSteps(event, article, abs);
  const ok: ArticleEvalMicroStatus[] = ['done', 'not_applicable'];
  return steps.every((s) => ok.includes(s.status));
}

/** @alias See `isArticleLifecycleCompleteForPayment`. */
export function isArticleRowThroughReviewGate(
  article: FormSubmission | undefined,
  event: Event,
  abstractAccepted?: boolean
): boolean {
  return isArticleLifecycleCompleteForPayment(article, event, abstractAccepted);
}

export function isArticleRowReadyForParticipantPayment(
  article: FormSubmission | undefined,
  event: Event,
  abstractAccepted?: boolean
): boolean {
  return isArticleLifecycleCompleteForPayment(article, event, abstractAccepted);
}
