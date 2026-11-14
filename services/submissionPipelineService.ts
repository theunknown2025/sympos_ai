import {
  Event,
  FormSubmission,
  SubmissionWorkflowPreset,
  SubmissionPipelineKind,
  type DecisionStatus,
} from '../types';
import type { SavedProgram } from './programService';
import {
  isArticleRowReadyForParticipantPayment,
  isArticleRowThroughReviewGate,
  requiresFullArticlePostAcceptPath,
} from './participantArticleEvaluationService';

export type PipelineStepId = 'abstract' | 'article' | 'payment' | 'program';

export type PipelineStepStatusUi =
  | 'upcoming'
  | 'in_progress'
  | 'done'
  | 'rejected'
  | 'waiting_review';

export interface PipelineStepUi {
  id: PipelineStepId;
  title: string;
  status: PipelineStepStatusUi;
  detail?: string;
  /** When the Program step is complete: short line for the participant’s slot (title, time, venue). */
  contributionSummary?: string;
}

export interface ParticipantPipelineProgramContext {
  /** Loaded published program for `event.publishedProgramId`, or null after fetch / if none. */
  publishedProgram: SavedProgram | null;
  /** True while fetching `publishedProgramId`. */
  programLoading: boolean;
}

/** IDs of this participant's abstract/article rows used to match a program card. */
export function getParticipantSubmissionIdsForProgram(event: Event, subs: FormSubmission[]): string[] {
  const abstractSub = getParticipantAbstractSubmission(event, subs);
  const articleSub = getParticipantArticleSubmission(
    event,
    subs,
    abstractSub?.submissionPipelineGroupId
  );
  const ids: string[] = [];
  if (articleSub?.id) ids.push(articleSub.id);
  if (abstractSub?.id) ids.push(abstractSub.id);
  return ids;
}

/** First program card tied to one of the participant’s submissions; formats a one-line summary. */
export function formatParticipantProgramSlotSummary(
  program: SavedProgram,
  submissionIds: string[]
): string | undefined {
  if (!submissionIds.length) return undefined;
  const card = program.cards.find((c) => c.submissionId && submissionIds.includes(c.submissionId));
  if (!card) return undefined;
  const venueName = program.venues.find((v) => v.id === card.venueId)?.name ?? 'Venue TBC';
  const dayNum = (card.dayIndex ?? 0) + 1;
  return `${card.title} · Day ${dayNum} · ${card.startTime}–${card.endTime} · ${venueName}`;
}

export function eventSubmissionPreset(event: Event): SubmissionWorkflowPreset {
  return event.submissionWorkflowPreset || 'A';
}

export function workflowNeedsAbstract(preset: SubmissionWorkflowPreset): boolean {
  return preset === 'C' || preset === 'D';
}

export function workflowNeedsPayment(preset: SubmissionWorkflowPreset): boolean {
  return preset === 'B' || preset === 'D';
}

export function submissionBelongsToEvent(sub: FormSubmission, event: Event): boolean {
  if (sub.eventId === event.id || sub.acceptedEventId === event.id) return true;
  if (event.landingPageIds?.length && event.landingPageIds.includes(sub.eventId)) return true;
  return false;
}

export function isAbstractFormForEvent(event: Event, formId: string): boolean {
  return Boolean(event.abstractSubmissionFormIds?.includes(formId));
}

export function isArticleFormForEvent(event: Event, formId: string): boolean {
  return Boolean(event.submissionFormIds?.includes(formId));
}

/** Submissions for this event (by id or landing page id on row). */
export function filterSubmissionsForEvent(subs: FormSubmission[], event: Event): FormSubmission[] {
  return subs.filter((s) => submissionBelongsToEvent(s, event));
}

export function inferPipelineKind(
  event: Event,
  formId: string
): SubmissionPipelineKind | undefined {
  const preset = eventSubmissionPreset(event);
  if (workflowNeedsAbstract(preset) && isAbstractFormForEvent(event, formId)) {
    return 'abstract';
  }
  if (isArticleFormForEvent(event, formId)) {
    return 'article';
  }
  if (event.submissionPaymentFormId && formId === event.submissionPaymentFormId) {
    return 'payment';
  }
  return undefined;
}

export function getParticipantPaymentSubmission(
  event: Event,
  subs: FormSubmission[],
  pipelineGroupId?: string
): FormSubmission | undefined {
  const formId = event.submissionPaymentFormId;
  if (!formId || !workflowNeedsPayment(eventSubmissionPreset(event))) return undefined;
  const pool = filterSubmissionsForEvent(subs, event).filter(
    (s) => s.formId === formId && s.submissionPipelineKind === 'payment'
  );
  if (pipelineGroupId) {
    return pool.find((s) => s.submissionPipelineGroupId === pipelineGroupId);
  }
  return pool[0];
}

export function getParticipantAbstractSubmission(
  event: Event,
  subs: FormSubmission[]
): FormSubmission | undefined {
  const preset = eventSubmissionPreset(event);
  if (!workflowNeedsAbstract(preset)) return undefined;
  const abstractIds = event.abstractSubmissionFormIds || [];
  return filterSubmissionsForEvent(subs, event).find(
    (s) =>
      abstractIds.includes(s.formId) &&
      (s.submissionPipelineKind === 'abstract' || (!s.submissionPipelineKind && abstractIds.includes(s.formId)))
  );
}

export function getParticipantArticleSubmission(
  event: Event,
  subs: FormSubmission[],
  pipelineGroupId?: string
): FormSubmission | undefined {
  const articleIds = event.submissionFormIds || [];
  const paymentFormId = event.submissionPaymentFormId;
  const pool = filterSubmissionsForEvent(subs, event)
    .filter((s) => articleIds.includes(s.formId))
    .filter((s) => !(paymentFormId && s.formId === paymentFormId));
  if (pipelineGroupId) {
    return pool.find((s) => s.submissionPipelineGroupId === pipelineGroupId);
  }
  return pool.find((s) => s.submissionPipelineKind === 'article' || !s.submissionPipelineKind) || pool[0];
}

export function buildParticipantPipelineTimeline(
  event: Event,
  subs: FormSubmission[],
  programCtx?: ParticipantPipelineProgramContext
): PipelineStepUi[] {
  if (!event.submissionFormIds?.length) {
    return [];
  }

  const preset = eventSubmissionPreset(event);
  const abstractSub = getParticipantAbstractSubmission(event, subs);
  const articleSub = getParticipantArticleSubmission(
    event,
    subs,
    abstractSub?.submissionPipelineGroupId
  );

  const abstractAcceptedForGate = workflowNeedsAbstract(preset)
    ? abstractSub?.decisionStatus === 'accepted'
    : true;

  const abstractStatus = (): PipelineStepStatusUi => {
    if (!workflowNeedsAbstract(preset)) return 'done';
    if (!abstractSub) return 'in_progress';
    if (abstractSub.decisionStatus === 'accepted') return 'done';
    if (abstractSub.decisionStatus === 'rejected') return 'rejected';
    if (abstractSub.decisionStatus === 'reserved') return 'in_progress';
    return 'waiting_review';
  };

  const articleStatus = (): PipelineStepStatusUi => {
    if (!articleSub) {
      if (workflowNeedsAbstract(preset)) {
        const a = abstractStatus();
        if (a === 'done') return 'in_progress';
        return 'upcoming';
      }
      return 'in_progress';
    }
    if (articleSub.decisionStatus === 'rejected') return 'rejected';
    if (requiresFullArticlePostAcceptPath(event) && articleSub.approvalStatus === 'rejected') return 'rejected';
    if (isArticleRowThroughReviewGate(articleSub, event, abstractAcceptedForGate)) return 'done';
    if (articleSub.decisionStatus === 'reserved') return 'in_progress';
    if (articleSub.decisionStatus === 'accepted') {
      if (requiresFullArticlePostAcceptPath(event) && articleSub.dispatchingStatus === 'in_review') {
        return 'in_progress';
      }
      return 'waiting_review';
    }
    return 'waiting_review';
  };

  const paymentStatus = (): PipelineStepStatusUi => {
    if (!workflowNeedsPayment(preset)) return 'done';
    if (articleStatus() !== 'done') return 'upcoming';
    if (articleSub?.submissionPaymentCompleted) return 'done';
    const paySub = event.submissionPaymentFormId
      ? getParticipantPaymentSubmission(event, subs, articleSub?.submissionPipelineGroupId)
      : undefined;
    if (paySub && !articleSub?.submissionPaymentCompleted) return 'waiting_review';
    return 'in_progress';
  };

  const steps: PipelineStepUi[] = [];

  if (workflowNeedsAbstract(preset)) {
    steps.push({
      id: 'abstract',
      title: 'Abstract',
      status: abstractStatus(),
      detail:
        abstractSub && !abstractSub.decisionStatus
          ? 'Under organizer review'
          : undefined,
    });
  }

  steps.push({
    id: 'article',
    title: 'Article / full paper',
    status: articleStatus(),
    detail:
      articleSub && !articleSub.decisionStatus
        ? 'Under organizer review'
        : articleSub?.decisionStatus === 'accepted' &&
            requiresFullArticlePostAcceptPath(event) &&
            !isArticleRowThroughReviewGate(articleSub, event, abstractAcceptedForGate)
          ? 'Your article is in the review pipeline (dispatch → evaluations → final approval) before payment or program.'
          : undefined,
  });

  if (workflowNeedsPayment(preset)) {
    steps.push({
      id: 'payment',
      title: 'Payment',
      status: paymentStatus(),
      detail: (() => {
        if (articleStatus() !== 'done') return undefined;
        if (articleSub?.submissionPaymentCompleted) return undefined;
        if (!event.submissionPaymentFormId) {
          return 'The organizer has not linked a payment form yet. Contact them if you need to pay.';
        }
        const paySub = getParticipantPaymentSubmission(event, subs, articleSub?.submissionPipelineGroupId);
        if (paySub) {
          return 'Your payment form was received; the organizer will confirm receipt on your submission.';
        }
        return 'Open this step to complete the payment form for this event.';
      })(),
    });
  }

  const priorComplete = isParticipantPipelineComplete(event, subs);
  const publishedProgram = programCtx?.publishedProgram ?? null;
  const programLoading = Boolean(programCtx?.programLoading);
  const submissionIds = getParticipantSubmissionIdsForProgram(event, subs);
  const contributionSummary =
    publishedProgram &&
    event.publishedProgramId &&
    publishedProgram.id === event.publishedProgramId
      ? formatParticipantProgramSlotSummary(publishedProgram, submissionIds)
      : undefined;

  let programStatus: PipelineStepStatusUi;
  let programDetail: string | undefined;
  let programContribution: string | undefined;

  if (!priorComplete) {
    programStatus = 'upcoming';
    programDetail = undefined;
  } else if (!event.publishedProgramId) {
    programStatus = 'in_progress';
    programDetail =
      'The organizer will publish the official program here when it is ready. You will see your session once it is added.';
  } else if (programLoading) {
    programStatus = 'in_progress';
    programDetail = 'Loading published program…';
  } else if (!publishedProgram) {
    programStatus = 'in_progress';
    programDetail =
      'The published program could not be loaded. Try again later or contact the organizer if this persists.';
  } else if (publishedProgram.id !== event.publishedProgramId) {
    programStatus = 'in_progress';
    programDetail = 'Program reference is being updated.';
  } else if (contributionSummary) {
    programStatus = 'done';
    programDetail = 'Your contribution appears in the official program.';
    programContribution = contributionSummary;
  } else {
    programStatus = 'in_progress';
    programDetail =
      'The program is published. Your session will appear here once the organizer places your contribution on the schedule.';
  }

  steps.push({
    id: 'program',
    title: 'Program',
    status: programStatus,
    detail: programDetail,
    contributionSummary: programContribution,
  });

  return steps;
}

/** Program step status from the participant timeline (requires program context when published). */
export function getParticipantProgramStepStatus(
  event: Event,
  subs: FormSubmission[],
  programCtx?: ParticipantPipelineProgramContext
): PipelineStepStatusUi {
  const step = buildParticipantPipelineTimeline(event, subs, programCtx).find((s) => s.id === 'program');
  return step?.status ?? 'upcoming';
}

/** True when the participant’s contribution appears on the published program (badge / check-in gate). */
export function isParticipantProgramStepComplete(
  event: Event,
  subs: FormSubmission[],
  programCtx?: ParticipantPipelineProgramContext
): boolean {
  return getParticipantProgramStepStatus(event, subs, programCtx) === 'done';
}

/**
 * Participant has no further submission forms to open (success path).
 * Preset A: article accepted. B/D: article accepted and payment when required. C: abstract + article accepted.
 */
export function isParticipantPipelineComplete(event: Event, subs: FormSubmission[]): boolean {
  const preset = eventSubmissionPreset(event);
  const abstractSub = getParticipantAbstractSubmission(event, subs);
  const articleSub = getParticipantArticleSubmission(
    event,
    subs,
    abstractSub?.submissionPipelineGroupId
  );

  const abstractAcceptedForGate = workflowNeedsAbstract(preset)
    ? abstractSub?.decisionStatus === 'accepted'
    : true;
  const articleThrough = isArticleRowThroughReviewGate(articleSub, event, abstractAcceptedForGate);

  if (preset === 'A') {
    return !!articleSub && articleThrough;
  }
  if (preset === 'B') {
    return (
      !!articleSub &&
      articleThrough &&
      Boolean(articleSub.submissionPaymentCompleted)
    );
  }
  if (preset === 'C') {
    return (
      !!abstractSub &&
      abstractSub.decisionStatus === 'accepted' &&
      !!articleSub &&
      articleThrough
    );
  }
  if (preset === 'D') {
    return (
      !!abstractSub &&
      abstractSub.decisionStatus === 'accepted' &&
      !!articleSub &&
      articleThrough &&
      Boolean(articleSub.submissionPaymentCompleted)
    );
  }
  return !!articleSub && articleThrough;
}

/** True when abstract or article row was rejected — participant cannot advance. */
export function pipelineHasRejectingDecision(event: Event, subs: FormSubmission[]): boolean {
  const abstractSub = getParticipantAbstractSubmission(event, subs);
  const articleSub = getParticipantArticleSubmission(
    event,
    subs,
    abstractSub?.submissionPipelineGroupId
  );
  return (
    abstractSub?.decisionStatus === 'rejected' ||
    articleSub?.decisionStatus === 'rejected' ||
    (requiresFullArticlePostAcceptPath(event) && articleSub?.approvalStatus === 'rejected')
  );
}

function decisionStatusParticipantLabel(status?: DecisionStatus): string {
  if (!status) return 'Under organizer review';
  if (status === 'accepted') return 'Accepted';
  if (status === 'reserved') return 'Changes requested';
  if (status === 'rejected') return 'Rejected';
  return status;
}

export type ParticipantPipelineStepClickAction =
  | { type: 'none' }
  | { type: 'open_form' }
  | { type: 'under_review'; message: string }
  | {
      type: 'feedback';
      submission?: FormSubmission;
      decisionLabel: string;
      comment: string;
      canResubmit: boolean;
    }
  | { type: 'info'; title: string; body: string };

/**
 * What should happen when the participant clicks a pipeline step (horizontal bar).
 */
export function resolveParticipantPipelineStepClickAction(
  event: Event,
  subs: FormSubmission[],
  step: PipelineStepUi,
  launch: ParticipantSubmissionLaunchResult
): ParticipantPipelineStepClickAction {
  const preset = eventSubmissionPreset(event);
  const abstractFormId = event.abstractSubmissionFormIds?.[0];
  const articleFormId = event.submissionFormIds?.[0];
  const abstractSub = getParticipantAbstractSubmission(event, subs);
  const articleSub = getParticipantArticleSubmission(
    event,
    subs,
    abstractSub?.submissionPipelineGroupId
  );

  const abstractAcceptedForGate = workflowNeedsAbstract(preset)
    ? abstractSub?.decisionStatus === 'accepted'
    : true;

  const launchOpensAbstract =
    launch.outcome === 'open' && abstractFormId && launch.formId === abstractFormId;
  const launchOpensArticle =
    launch.outcome === 'open' && articleFormId && launch.formId === articleFormId;

  if (step.id === 'abstract' && workflowNeedsAbstract(preset)) {
    if (!abstractSub) {
      if (step.status === 'in_progress' && launchOpensAbstract) return { type: 'open_form' };
      return { type: 'none' };
    }
    if (abstractSub.decisionStatus === 'rejected') {
      return {
        type: 'feedback',
        submission: abstractSub,
        decisionLabel: decisionStatusParticipantLabel('rejected'),
        comment: abstractSub.decisionComment?.trim() || 'No commentary was provided.',
        canResubmit: false,
      };
    }
    if (abstractSub.decisionStatus === 'reserved') {
      return {
        type: 'feedback',
        submission: abstractSub,
        decisionLabel: decisionStatusParticipantLabel('reserved'),
        comment: abstractSub.decisionComment?.trim() || 'No commentary was provided.',
        canResubmit: launchOpensAbstract,
      };
    }
    if (abstractSub.decisionStatus === 'accepted') {
      return {
        type: 'feedback',
        submission: abstractSub,
        decisionLabel: decisionStatusParticipantLabel('accepted'),
        comment: abstractSub.decisionComment?.trim() || 'No additional commentary.',
        canResubmit: false,
      };
    }
    return {
      type: 'under_review',
      message:
        'Your abstract is with the organizer for review. You will be able to continue once a decision is recorded.',
    };
  }

  if (step.id === 'article') {
    if (!articleSub) {
      if (workflowNeedsAbstract(preset)) {
        const a = abstractSub?.decisionStatus;
        if (a !== 'accepted') return { type: 'none' };
      }
      if (step.status === 'in_progress' && launchOpensArticle) return { type: 'open_form' };
      return { type: 'none' };
    }
    if (articleSub.decisionStatus === 'rejected') {
      return {
        type: 'feedback',
        submission: articleSub,
        decisionLabel: decisionStatusParticipantLabel('rejected'),
        comment: articleSub.decisionComment?.trim() || 'No commentary was provided.',
        canResubmit: false,
      };
    }
    if (articleSub.decisionStatus === 'reserved') {
      return {
        type: 'feedback',
        submission: articleSub,
        decisionLabel: decisionStatusParticipantLabel('reserved'),
        comment: articleSub.decisionComment?.trim() || 'No commentary was provided.',
        canResubmit: launchOpensArticle,
      };
    }
    if (articleSub.decisionStatus === 'accepted' && requiresFullArticlePostAcceptPath(event)) {
      if (!isArticleRowThroughReviewGate(articleSub, event, abstractAcceptedForGate)) {
        return {
          type: 'info',
          title: 'Article pipeline',
          body:
            'Your article passed initial acceptance. Payment only unlocks when every step is complete: Received → Accepted → Dispatched → Modifications → Evaluated → Approved.',
        };
      }
    }
    if (articleSub.decisionStatus === 'accepted') {
      return {
        type: 'feedback',
        submission: articleSub,
        decisionLabel: decisionStatusParticipantLabel('accepted'),
        comment: articleSub.decisionComment?.trim() || 'No additional commentary.',
        canResubmit: false,
      };
    }
    return {
      type: 'under_review',
      message:
        'Your article is with the organizer for review. You will be able to continue once a decision is recorded.',
    };
  }

  if (step.id === 'payment') {
    if (!workflowNeedsPayment(preset)) return { type: 'none' };
    const paymentFormId = event.submissionPaymentFormId;
    if (!paymentFormId) {
      return {
        type: 'info',
        title: 'Payment',
        body:
          step.detail?.trim() ||
          'The organizer has not configured a payment form for this event yet.',
      };
    }
    if (step.status === 'done') {
      return {
        type: 'info',
        title: 'Payment',
        body: 'Your payment has been confirmed. You can continue with the next steps.',
      };
    }
    if (step.status === 'waiting_review') {
      return {
        type: 'under_review',
        message:
          'Your payment form was submitted. The organizer will confirm receipt on your article submission when it is verified.',
      };
    }
    const opensPayment =
      launch.outcome === 'open' &&
      launch.formId === paymentFormId &&
      launch.pipelineContext?.submissionPipelineKind === 'payment';
    if (step.status === 'in_progress' && opensPayment) {
      return { type: 'open_form' };
    }
    return {
      type: 'info',
      title: 'Payment',
      body:
        step.detail?.trim() ||
        'Payment is not available yet. Complete earlier steps first.',
    };
  }

  if (step.id === 'program') {
    const parts = [step.detail, step.contributionSummary].filter(Boolean).join('\n\n');
    return {
      type: 'info',
      title: 'Program',
      body: parts.trim() || 'Program information will appear here when the organizer publishes it.',
    };
  }

  return { type: 'none' };
}

/** Whether the participant can open the submission form modal for this event. */
export function canParticipantOpenSubmissionForm(event: Event, subs: FormSubmission[]): boolean {
  if (isParticipantPipelineComplete(event, subs)) return false;
  const preset = eventSubmissionPreset(event);
  const abstractSub = getParticipantAbstractSubmission(event, subs);
  const articleSub = getParticipantArticleSubmission(
    event,
    subs,
    abstractSub?.submissionPipelineGroupId
  );

  const abstractAcceptedForGate = workflowNeedsAbstract(preset)
    ? abstractSub?.decisionStatus === 'accepted'
    : true;

  if (workflowNeedsAbstract(preset)) {
    if (!abstractSub) return true;
    if (abstractSub.decisionStatus === 'rejected') return false;
    if (abstractSub.decisionStatus === 'reserved') return true;
    if (abstractSub.decisionStatus !== 'accepted') return false;
    if (!articleSub) return true;
    if (articleSub.decisionStatus === 'rejected') return false;
    if (articleSub.decisionStatus === 'reserved') return true;
    if (!isArticleRowThroughReviewGate(articleSub, event, abstractAcceptedForGate)) return false;
    if (
      workflowNeedsPayment(preset) &&
      !articleSub.submissionPaymentCompleted &&
      event.submissionPaymentFormId
    ) {
      const pay = getParticipantPaymentSubmission(event, subs, articleSub.submissionPipelineGroupId);
      if (!pay) return true;
    }
    return false;
  }

  if (!articleSub) return true;
  if (articleSub.decisionStatus === 'rejected') return false;
  if (articleSub.decisionStatus === 'reserved') return true;
  if (!isArticleRowThroughReviewGate(articleSub, event, abstractAcceptedForGate)) return false;
  if (
    workflowNeedsPayment(preset) &&
    !articleSub.submissionPaymentCompleted &&
    event.submissionPaymentFormId
  ) {
    const pay = getParticipantPaymentSubmission(event, subs, articleSub.submissionPipelineGroupId);
    if (!pay) return true;
  }
  return false;
}

export function getSubmitPaperButtonLabel(event: Event, subs: FormSubmission[]): string {
  if (isParticipantPipelineComplete(event, subs)) return 'Submitted';

  const preset = eventSubmissionPreset(event);
  const abstractSub = getParticipantAbstractSubmission(event, subs);
  const articleSub = getParticipantArticleSubmission(
    event,
    subs,
    abstractSub?.submissionPipelineGroupId
  );

  const abstractAcceptedForGate = workflowNeedsAbstract(preset)
    ? abstractSub?.decisionStatus === 'accepted'
    : true;

  if (workflowNeedsAbstract(preset) && abstractSub?.decisionStatus === 'rejected') {
    return 'Abstract rejected';
  }
  if (workflowNeedsAbstract(preset) && abstractSub?.decisionStatus === 'reserved') {
    return 'Revise abstract';
  }
  if (workflowNeedsAbstract(preset) && abstractSub && abstractSub.decisionStatus !== 'accepted') {
    return 'Abstract in review';
  }
  if (workflowNeedsAbstract(preset) && !abstractSub) {
    return 'Submit abstract';
  }
  if (workflowNeedsAbstract(preset) && abstractSub?.decisionStatus === 'accepted' && !articleSub) {
    return 'Submit article';
  }
  if (articleSub?.decisionStatus === 'rejected') {
    return 'Article rejected';
  }
  if (articleSub?.decisionStatus === 'reserved') {
    return 'Revise article';
  }
  if (
    articleSub &&
    articleSub.decisionStatus !== 'accepted' &&
    articleSub.decisionStatus !== 'rejected'
  ) {
    return 'Article in review';
  }
  if (
    articleSub?.decisionStatus === 'accepted' &&
    requiresFullArticlePostAcceptPath(event) &&
    !isArticleRowThroughReviewGate(articleSub, event, abstractAcceptedForGate)
  ) {
    return 'Article in review';
  }
  if (
    articleSub &&
    isArticleRowReadyForParticipantPayment(articleSub, event, abstractAcceptedForGate) &&
    workflowNeedsPayment(preset) &&
    !articleSub.submissionPaymentCompleted
  ) {
    if (event.submissionPaymentFormId) {
      const pay = getParticipantPaymentSubmission(event, subs, articleSub.submissionPipelineGroupId);
      return pay ? 'Payment pending confirmation' : 'Submit payment';
    }
    return 'Awaiting payment';
  }
  return 'Submit paper';
}

export function isSubmitPaperDisabled(event: Event, subs: FormSubmission[]): boolean {
  return !canParticipantOpenSubmissionForm(event, subs);
}

/** Context passed to FormModal when opening abstract or article submission. */
export interface ParticipantSubmissionFormLaunchContext {
  submissionPipelineKind: SubmissionPipelineKind;
  submissionPipelineGroupId: string;
  parentSubmissionId?: string | null;
}

export type ParticipantSubmissionLaunchResult =
  | { outcome: 'open'; formId: string; pipelineContext: ParticipantSubmissionFormLaunchContext | null }
  | { outcome: 'complete' }
  | { outcome: 'wait'; message: string }
  | { outcome: 'misconfigured'; message: string };

function newPipelineGroupId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Resolves which submission form the participant should open next (same rules as Events → Submit paper).
 */
export function tryLaunchParticipantSubmissionForm(
  event: Event,
  subs: FormSubmission[]
): ParticipantSubmissionLaunchResult {
  if (!event.submissionFormIds?.length) {
    return { outcome: 'misconfigured', message: 'No submission form available for this event.' };
  }
  const preset = eventSubmissionPreset(event);
  const abstractFormId = event.abstractSubmissionFormIds?.[0];
  const articleFormId = event.submissionFormIds[0];

  if (workflowNeedsAbstract(preset) && (!abstractFormId || !articleFormId)) {
    return {
      outcome: 'misconfigured',
      message: 'This event’s submission workflow is not fully configured. Please contact the organizer.',
    };
  }

  if (isParticipantPipelineComplete(event, subs)) {
    return { outcome: 'complete' };
  }

  const abs = getParticipantAbstractSubmission(event, subs);
  const art = getParticipantArticleSubmission(event, subs, abs?.submissionPipelineGroupId);
  const abstractOk = workflowNeedsAbstract(preset) ? abs?.decisionStatus === 'accepted' : true;

  if (!canParticipantOpenSubmissionForm(event, subs)) {
    if (abs?.decisionStatus === 'rejected' || art?.decisionStatus === 'rejected') {
      return {
        outcome: 'wait',
        message:
          'This submission was rejected. You cannot continue with the next steps for this event.',
      };
    }
    if (
      workflowNeedsPayment(preset) &&
      art &&
      isArticleRowReadyForParticipantPayment(art, event, abstractOk) &&
      !art.submissionPaymentCompleted &&
      !event.submissionPaymentFormId
    ) {
      return {
        outcome: 'misconfigured',
        message:
          'This event is missing a submission payment form. Please contact the organizer.',
      };
    }
    return {
      outcome: 'wait',
      message:
        'This step is not available yet. Finish the previous step or wait for the organizer to review your submission.',
    };
  }

  if (workflowNeedsAbstract(preset) && abs?.decisionStatus === 'reserved' && abstractFormId) {
    return {
      outcome: 'open',
      formId: abstractFormId,
      pipelineContext: {
        submissionPipelineKind: 'abstract',
        submissionPipelineGroupId: abs.submissionPipelineGroupId || newPipelineGroupId(),
        parentSubmissionId: abs.parentSubmissionId ?? null,
      },
    };
  }

  if (
    workflowNeedsAbstract(preset) &&
    abs?.decisionStatus === 'accepted' &&
    art?.decisionStatus === 'reserved' &&
    articleFormId
  ) {
    return {
      outcome: 'open',
      formId: articleFormId,
      pipelineContext: {
        submissionPipelineKind: 'article',
        submissionPipelineGroupId: abs.submissionPipelineGroupId!,
        parentSubmissionId: abs.id,
      },
    };
  }

  if (!workflowNeedsAbstract(preset) && art?.decisionStatus === 'reserved' && articleFormId) {
    const pipelineContext: ParticipantSubmissionFormLaunchContext | null = art.submissionPipelineGroupId
      ? {
          submissionPipelineKind: 'article',
          submissionPipelineGroupId: art.submissionPipelineGroupId,
          parentSubmissionId: art.parentSubmissionId ?? null,
        }
      : null;
    return { outcome: 'open', formId: articleFormId, pipelineContext };
  }

  if (workflowNeedsAbstract(preset) && abstractFormId && !abs) {
    return {
      outcome: 'open',
      formId: abstractFormId,
      pipelineContext: {
        submissionPipelineKind: 'abstract',
        submissionPipelineGroupId: newPipelineGroupId(),
        parentSubmissionId: null,
      },
    };
  }

  if (workflowNeedsAbstract(preset) && abs?.decisionStatus === 'accepted' && !art && articleFormId) {
    return {
      outcome: 'open',
      formId: articleFormId,
      pipelineContext: {
        submissionPipelineKind: 'article',
        submissionPipelineGroupId: abs.submissionPipelineGroupId!,
        parentSubmissionId: abs.id,
      },
    };
  }

  if (
    workflowNeedsPayment(preset) &&
    art &&
    isArticleRowReadyForParticipantPayment(art, event, abstractOk) &&
    !art.submissionPaymentCompleted &&
    event.submissionPaymentFormId
  ) {
    const paySub = getParticipantPaymentSubmission(event, subs, art.submissionPipelineGroupId);
    if (paySub) {
      return {
        outcome: 'wait',
        message:
          'Your payment form was already submitted. Please wait for the organizer to confirm receipt on your submission.',
      };
    }
    return {
      outcome: 'open',
      formId: event.submissionPaymentFormId,
      pipelineContext: {
        submissionPipelineKind: 'payment',
        submissionPipelineGroupId: art.submissionPipelineGroupId!,
        parentSubmissionId: art.id,
      },
    };
  }

  return { outcome: 'open', formId: articleFormId, pipelineContext: null };
}

export function workflowPresetLabel(preset: SubmissionWorkflowPreset): string {
  switch (preset) {
    case 'A':
      return 'A — Article only';
    case 'B':
      return 'B — Article + payment';
    case 'C':
      return 'C — Abstract + article';
    case 'D':
      return 'D — Abstract + article + payment';
    default:
      return preset;
  }
}
