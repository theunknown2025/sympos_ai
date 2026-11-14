import { supabase, TABLES } from '../supabase';
import type { Event, FormSubmission } from '../types';
import type { SavedProgram } from './programService';
import {
  generateAndSaveBadge,
  getBadgeForSubmission,
  type ParticipantBadge,
} from './badgeGeneratorService';
import { mapDbRowToFormSubmission } from './registrationSubmissionService';
import {
  filterSubmissionsForEvent,
  getParticipantAbstractSubmission,
  getParticipantArticleSubmission,
  isArticleFormForEvent,
  isParticipantPipelineComplete,
  isParticipantProgramStepComplete,
  type ParticipantPipelineProgramContext,
} from './submissionPipelineService';

export interface SubmissionBadgeEligibility {
  eligible: boolean;
  reason?: string;
  badgeTemplateId?: string;
}

export interface SubmissionBadgeVerification {
  valid: boolean;
  error?: string;
  badge?: ParticipantBadge;
  articleSubmission?: FormSubmission;
  programSlotSummary?: string;
  pipelineComplete?: boolean;
  programComplete?: boolean;
}

/** First badge template linked on the event (organizer selection). */
export function getEventSubmissionBadgeTemplateId(event: Event): string | undefined {
  const ids = event.submissionBadgeTemplateIds?.length
    ? event.submissionBadgeTemplateIds
    : event.badgeTemplateIds;
  if (!ids?.length) return undefined;
  return ids[0];
}

export function isArticleSubmissionForEvent(submission: FormSubmission, event: Event): boolean {
  if (submission.submissionPipelineKind === 'article') return true;
  if (submission.submissionPipelineKind === 'abstract' || submission.submissionPipelineKind === 'payment') {
    return false;
  }
  return isArticleFormForEvent(event, submission.formId);
}

export function getSubmissionDisplayTitle(submission: FormSubmission): string {
  const fromAnswers =
    (submission.answers?.title as string) ||
    (submission.answers?.paper_title as string) ||
    (submission.answers?.submission_title as string);
  if (fromAnswers && String(fromAnswers).trim()) return String(fromAnswers).trim();
  return submission.generalInfo?.name || submission.submittedBy || 'Submission';
}

export function evaluateSubmissionBadgeEligibility(
  event: Event,
  subsForEvent: FormSubmission[],
  programCtx?: ParticipantPipelineProgramContext
): SubmissionBadgeEligibility {
  const templateId = getEventSubmissionBadgeTemplateId(event);
  if (!templateId) {
    return { eligible: false, reason: 'No badge template is configured for this event.' };
  }

  if (!isParticipantPipelineComplete(event, subsForEvent)) {
    return {
      eligible: false,
      reason: 'Complete all submission steps before your badge is available.',
    };
  }

  if (!isParticipantProgramStepComplete(event, subsForEvent, programCtx)) {
    return {
      eligible: false,
      reason: 'Your contribution must appear on the published program before you can download your badge.',
    };
  }

  const abstractSub = getParticipantAbstractSubmission(event, subsForEvent);
  const articleSub = getParticipantArticleSubmission(
    event,
    subsForEvent,
    abstractSub?.submissionPipelineGroupId
  );
  if (!articleSub) {
    return { eligible: false, reason: 'No article submission found for this event.' };
  }

  return { eligible: true, badgeTemplateId: templateId };
}

export async function getFormSubmissionById(submissionId: string): Promise<FormSubmission | null> {
  const { data, error } = await supabase
    .from(TABLES.FORM_SUBMISSIONS)
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();
  if (error || !data) return null;
  return mapDbRowToFormSubmission(data);
}

/** Load participant rows for the same pipeline group / event (for verification). */
export async function getParticipantSubsForBadgeVerification(
  event: Event,
  articleSubmission: FormSubmission
): Promise<FormSubmission[]> {
  const participantId = articleSubmission.participantUserId || articleSubmission.userId;
  if (!participantId) return [articleSubmission];

  const { data, error } = await supabase
    .from(TABLES.FORM_SUBMISSIONS)
    .select('*')
    .or(`participant_user_id.eq.${participantId},user_id.eq.${participantId}`);

  if (error || !data?.length) return [articleSubmission];

  const mapped = data.map((row) => mapDbRowToFormSubmission(row));
  const forEvent = filterSubmissionsForEvent(mapped, event);
  const groupId = articleSubmission.submissionPipelineGroupId;
  if (!groupId) return forEvent.length ? forEvent : [articleSubmission];
  const inGroup = forEvent.filter((s) => s.submissionPipelineGroupId === groupId);
  return inGroup.length ? inGroup : forEvent;
}

export async function verifySubmissionBadgeForCheckin(
  badge: ParticipantBadge,
  event: Event,
  publishedProgram: SavedProgram | null
): Promise<SubmissionBadgeVerification> {
  if (badge.eventId !== event.id) {
    return { valid: false, error: 'This badge belongs to a different event.' };
  }

  const submission = await getFormSubmissionById(badge.formSubmissionId);
  if (!submission) {
    return { valid: false, error: 'Submission record not found for this badge.' };
  }

  if (!isArticleSubmissionForEvent(submission, event)) {
    return {
      valid: false,
      error: 'This QR code is not a presenter submission badge. Use the registration badger instead.',
    };
  }

  const subsForParticipant = await getParticipantSubsForBadgeVerification(event, submission);
  const programCtx: ParticipantPipelineProgramContext = {
    publishedProgram,
    programLoading: false,
  };

  const pipelineComplete = isParticipantPipelineComplete(event, subsForParticipant);
  const programComplete = isParticipantProgramStepComplete(event, subsForParticipant, programCtx);

  if (!pipelineComplete || !programComplete) {
    return {
      valid: false,
      error: 'Presenter has not completed the full submission program workflow.',
      badge,
      articleSubmission: submission,
      pipelineComplete,
      programComplete,
    };
  }

  const submissionIds = subsForParticipant.map((s) => s.id);
  let programSlotSummary: string | undefined;
  if (publishedProgram && event.publishedProgramId === publishedProgram.id) {
    const card = publishedProgram.cards.find(
      (c) => c.submissionId && submissionIds.includes(c.submissionId)
    );
    if (card) {
      const venue = publishedProgram.venues.find((v) => v.id === card.venueId)?.name ?? 'Venue TBC';
      const dayNum = (card.dayIndex ?? 0) + 1;
      programSlotSummary = `${card.title} · Day ${dayNum} · ${card.startTime}–${card.endTime} · ${venue}`;
    }
  }

  return {
    valid: true,
    badge,
    articleSubmission: submission,
    programSlotSummary,
    pipelineComplete: true,
    programComplete: true,
  };
}

export async function ensureSubmissionParticipantBadge(
  event: Event,
  articleSubmission: FormSubmission,
  subsForEvent: FormSubmission[],
  programCtx?: ParticipantPipelineProgramContext
): Promise<ParticipantBadge | null> {
  const eligibility = evaluateSubmissionBadgeEligibility(event, subsForEvent, programCtx);
  if (!eligibility.eligible || !eligibility.badgeTemplateId) return null;

  const existing = await getBadgeForSubmission(articleSubmission.id);
  if (existing) return existing;

  const ownerUserId =
    articleSubmission.participantUserId || articleSubmission.userId || event.userId;
  if (!ownerUserId) {
    throw new Error('Cannot generate badge: missing participant account.');
  }

  const eventId = articleSubmission.acceptedEventId || articleSubmission.eventId || event.id;
  return generateAndSaveBadge(
    ownerUserId,
    eventId,
    articleSubmission.id,
    eligibility.badgeTemplateId,
    articleSubmission
  );
}
