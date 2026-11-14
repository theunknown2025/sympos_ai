import { getJuryMemberProfile, getParticipantEventsByIds } from './juryMemberService';
import { getRegistrationSubmissions } from './registrationSubmissionService';
import { getRegistrationFormsMetadataByIds } from './registrationFormService';
import type { Event, FormSubmission } from '../types';
import { submissionBelongsToEvent } from './submissionPipelineService';
import {
  dedupeSubmissionsById,
  filterRegistrationsWithFormTitles,
  filterSubmissionsWithFormTitles,
  type FormMetadata,
  type FormSubmissionWithTitle,
} from './participantSubmissionUtils';

export type ParticipantSubmissionBundle = {
  allSubmissions: FormSubmission[];
  formsById: Map<string, FormMetadata>;
};

export type ParticipantSubmissionsPageData = {
  submissions: FormSubmissionWithTitle[];
  events: Event[];
};

const collectSubmissionEventIds = (submissions: FormSubmission[]): string[] => {
  const ids = new Set<string>();
  for (const submission of submissions) {
    if (submission.eventId) ids.add(submission.eventId);
    if (submission.acceptedEventId) ids.add(submission.acceptedEventId);
  }
  return [...ids];
};

/** Profile + submissions in parallel, optional jury-email merge, batched form metadata. */
export const loadParticipantSubmissionBundle = async (
  userEmail: string,
  userId: string
): Promise<ParticipantSubmissionBundle> => {
  const [profile, primarySubmissions] = await Promise.all([
    getJuryMemberProfile(userId).catch(() => null),
    getRegistrationSubmissions(userEmail, userId),
  ]);

  let allSubmissions = primarySubmissions;

  if (profile?.email && profile.email !== userEmail) {
    const mergedSubmissions = await getRegistrationSubmissions(
      profile.email,
      userId,
      profile.email
    );
    allSubmissions = dedupeSubmissionsById([...primarySubmissions, ...mergedSubmissions]);
    allSubmissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  const formIds = [...new Set(allSubmissions.map((s) => s.formId))];
  const formsById = await getRegistrationFormsMetadataByIds(formIds);

  return { allSubmissions, formsById };
};

export const loadParticipantRegistrations = async (
  userEmail: string,
  userId: string
): Promise<FormSubmissionWithTitle[]> => {
  const { allSubmissions, formsById } = await loadParticipantSubmissionBundle(userEmail, userId);
  return filterRegistrationsWithFormTitles(allSubmissions, formsById);
};

export const loadParticipantPaperSubmissions = async (
  userEmail: string,
  userId: string,
  events: Event[] = []
): Promise<FormSubmissionWithTitle[]> => {
  const { allSubmissions, formsById } = await loadParticipantSubmissionBundle(userEmail, userId);

  return filterSubmissionsWithFormTitles(allSubmissions, formsById, {
    isSubmissionPaymentForm: (submission) =>
      events.some(
        (ev) =>
          ev.submissionPaymentFormId === submission.formId &&
          submissionBelongsToEvent(submission, ev)
      ),
  });
};

/**
 * Optimized load for the participant Submissions page: submissions bundle + only related events (not full catalog).
 */
export const loadParticipantSubmissionsPage = async (
  userEmail: string,
  userId: string
): Promise<ParticipantSubmissionsPageData> => {
  const bundle = await loadParticipantSubmissionBundle(userEmail, userId);
  const eventIds = collectSubmissionEventIds(bundle.allSubmissions);
  const events = eventIds.length > 0 ? await getParticipantEventsByIds(eventIds) : [];

  const submissions = filterSubmissionsWithFormTitles(bundle.allSubmissions, bundle.formsById, {
    isSubmissionPaymentForm: (submission) =>
      events.some(
        (ev) =>
          ev.submissionPaymentFormId === submission.formId &&
          submissionBelongsToEvent(submission, ev)
      ),
  });

  const relevantEventIds = new Set(collectSubmissionEventIds(submissions));
  const relevantEvents = events.filter((event) => relevantEventIds.has(event.id));

  return { submissions, events: relevantEvents };
};
