import type { Event, FormSubmission } from '../types';

export type CertificateGeneratorScope = 'registration' | 'submission';

export function getEventCertificateTemplateIds(
  event: Event,
  scope: CertificateGeneratorScope
): string[] {
  if (scope === 'registration') {
    return event.registrationCertificateTemplateIds?.length
      ? event.registrationCertificateTemplateIds
      : event.certificateTemplateIds || [];
  }
  return event.submissionCertificateTemplateIds || [];
}

export function filterApprovedRegistrationSubmissions(
  event: Event,
  submissions: FormSubmission[]
): FormSubmission[] {
  const registrationFormIds = new Set(event.registrationFormIds || []);
  if (registrationFormIds.size === 0) return [];

  return submissions.filter(
    (sub) =>
      registrationFormIds.has(sub.formId) &&
      sub.approvalStatus === 'accepted' &&
      (sub.eventId === event.id || sub.acceptedEventId === event.id)
  );
}

export function getSubmissionDisplayName(submission: FormSubmission): string {
  const fromAnswers =
    (submission.answers?.title as string) ||
    (submission.answers?.paper_title as string) ||
    (submission.answers?.submission_title as string);
  if (fromAnswers && String(fromAnswers).trim()) return String(fromAnswers).trim();
  return (
    submission.generalInfo?.name ||
    submission.submittedBy ||
    (submission.answers?.general_name as string) ||
    'Participant'
  );
}

export function getParticipantDisplayName(submission: FormSubmission): string {
  return (
    submission.generalInfo?.name ||
    submission.submittedBy ||
    (submission.answers?.general_name as string) ||
    getSubmissionDisplayName(submission)
  );
}
