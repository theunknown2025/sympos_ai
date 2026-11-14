import type { Event, FormSubmission, RegistrationForm } from '../types';
import {
  buildRegistrationCertificateFields,
  buildSubmissionCertificateFields,
  findCertificateFieldLabel,
  resolveCertificateFieldValue,
  type CertificateInsertableField,
} from './certificateTemplateFields';

export type CheckinDisplayKind = 'registration' | 'submission';

export function buildCheckinSelectableFields(
  event: Event,
  forms: RegistrationForm[],
  kind: CheckinDisplayKind
): CertificateInsertableField[] {
  return kind === 'registration'
    ? buildRegistrationCertificateFields(event, forms)
    : buildSubmissionCertificateFields(event, forms);
}

export function getCheckinDisplayFieldKeys(event: Event, kind: CheckinDisplayKind): string[] {
  return kind === 'registration'
    ? event.registrationCheckinDisplayFieldKeys || []
    : event.submissionCheckinDisplayFieldKeys || [];
}

export function resolveCheckinDisplayFields(
  event: Event,
  forms: RegistrationForm[],
  submission: FormSubmission,
  kind: CheckinDisplayKind
): Array<{ key: string; label: string; value: string }> {
  const keys = getCheckinDisplayFieldKeys(event, kind);
  if (keys.length === 0) return [];

  const catalog = buildCheckinSelectableFields(event, forms, kind);

  return keys
    .map((key) => {
      const value = resolveCertificateFieldValue(key, submission, event).trim();
      if (!value) return null;
      return {
        key,
        label: findCertificateFieldLabel(key, undefined, catalog),
        value,
      };
    })
    .filter((row): row is { key: string; label: string; value: string } => row !== null);
}
