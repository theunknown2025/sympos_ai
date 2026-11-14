import { getUserEvents } from '../../../../services/eventService';
import { getSubmissionsForUserForms, FormSubmission } from '../../../../services/registrationSubmissionService';
import { Event } from '../../../../types';
import { resolveSubmissionEvent } from './receivedSubmissionsUtils';

/** Loads and normalizes submissions for the organizer (same rules as Received Submissions). */
export async function fetchNormalizedSubmissionsForOrganizer(
  userId: string
): Promise<{ submissions: FormSubmission[]; events: Event[] }> {
  const userEvents = await getUserEvents(userId);
  const submissionFormIds = new Set<string>();
  userEvents.forEach((event) => {
    if (event.submissionFormIds && event.submissionFormIds.length > 0) {
      event.submissionFormIds.forEach((formId) => submissionFormIds.add(formId));
    } else if ((event as { submissionFormId?: string }).submissionFormId) {
      submissionFormIds.add((event as { submissionFormId?: string }).submissionFormId!);
    }
    (event.abstractSubmissionFormIds || []).forEach((formId) => submissionFormIds.add(formId));
    if (event.submissionPaymentFormId) {
      submissionFormIds.add(event.submissionPaymentFormId);
    }
  });

  const submissionFormIdsArray =
    submissionFormIds.size > 0 ? Array.from(submissionFormIds) : undefined;

  const allSubmissions = await getSubmissionsForUserForms(userId, submissionFormIdsArray);

  const normalizedSubmissions = allSubmissions
    .map((submission) => {
      if (!submissionFormIds.has(submission.formId)) {
        return null;
      }
      const matchingEvent = resolveSubmissionEvent(submission, userEvents);
      if (!matchingEvent) {
        return null;
      }
      return {
        ...submission,
        eventId: matchingEvent.id,
        eventTitle: matchingEvent.name,
      };
    })
    .filter((submission): submission is FormSubmission => submission !== null);

  return { submissions: normalizedSubmissions, events: userEvents };
}
