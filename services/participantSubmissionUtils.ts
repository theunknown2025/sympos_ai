import type { FormSubmission, RegistrationForm } from '../types';
import { inferRegistrationFormCategory } from './registrationFormService';

export type FormMetadata = Pick<RegistrationForm, 'id' | 'title' | 'formCategory'>;

export type FormSubmissionWithTitle = FormSubmission & { formTitle?: string };

/** True when the form is a paper/submission form (not registration or payment). */
export function isSubmissionFormMetadata(form: FormMetadata): boolean {
  const category = inferRegistrationFormCategory(form as RegistrationForm);
  if (category === 'submission') return true;
  const titleLower = form.title.toLowerCase();
  return titleLower.includes('submission') || titleLower.includes('submit');
}

/** True when the form is a registration (or payment) form. */
export function isRegistrationFormMetadata(form: FormMetadata): boolean {
  return !isSubmissionFormMetadata(form);
}

export function filterRegistrationsWithFormTitles(
  submissions: FormSubmission[],
  formsById: Map<string, FormMetadata>
): FormSubmissionWithTitle[] {
  const result: FormSubmissionWithTitle[] = [];
  for (const submission of submissions) {
    const form = formsById.get(submission.formId);
    if (!form || !isRegistrationFormMetadata(form)) continue;
    result.push({ ...submission, formTitle: form.title });
  }
  return result;
}

export function filterSubmissionsWithFormTitles(
  submissions: FormSubmission[],
  formsById: Map<string, FormMetadata>,
  options?: {
    /** Include payment-step rows tied to an event submission payment form. */
    isSubmissionPaymentForm?: (submission: FormSubmission) => boolean;
  }
): FormSubmissionWithTitle[] {
  const result: FormSubmissionWithTitle[] = [];
  for (const submission of submissions) {
    const form = formsById.get(submission.formId);
    if (!form) continue;
    const isSubmissionForm = isSubmissionFormMetadata(form);
    const isPaymentForm = options?.isSubmissionPaymentForm?.(submission) ?? false;
    if (!isSubmissionForm && !isPaymentForm) continue;
    result.push({ ...submission, formTitle: form.title });
  }
  return result;
}

export function dedupeSubmissionsById(submissions: FormSubmission[]): FormSubmission[] {
  const seen = new Set<string>();
  const result: FormSubmission[] = [];
  for (const submission of submissions) {
    if (seen.has(submission.id)) continue;
    seen.add(submission.id);
    result.push(submission);
  }
  return result;
}
