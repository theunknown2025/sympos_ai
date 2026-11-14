import type { Event, FormSubmission, RegistrationForm } from '../types';

export type CertificateFieldSource = 'event' | 'registration' | 'submission';

export interface CertificateInsertableField {
  key: string;
  label: string;
  category: string;
  source: CertificateFieldSource;
  previewText: string;
}

const formatEventDate = (iso?: string): string => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const formatEventDates = (event: Event): string => {
  if (!event.dates?.length) return '';
  return event.dates
    .map((d) => {
      const start = formatEventDate(d.startDate);
      const end = d.endDate !== d.startDate ? formatEventDate(d.endDate) : '';
      return end ? `${start} – ${end}` : start;
    })
    .join('; ');
};

export function buildEventCertificateFields(event: Event): CertificateInsertableField[] {
  const partners = (event.partners || []).map((p) => p.name).filter(Boolean).join(', ');
  return [
    { key: 'event:name', label: 'Event name', category: 'Event', source: 'event', previewText: event.name || 'Event name' },
    { key: 'event:description', label: 'Description', category: 'Event', source: 'event', previewText: event.description || 'Event description' },
    { key: 'event:location', label: 'Location', category: 'Event', source: 'event', previewText: event.location || 'Location' },
    { key: 'event:eventType', label: 'Event type', category: 'Event', source: 'event', previewText: event.eventType || 'Conference' },
    { key: 'event:eventFormat', label: 'Event format', category: 'Event', source: 'event', previewText: event.eventFormat || 'Hybrid' },
    { key: 'event:keywords', label: 'Keywords', category: 'Event', source: 'event', previewText: (event.keywords || []).join(', ') || 'Keywords' },
    { key: 'event:fields', label: 'Fields', category: 'Event', source: 'event', previewText: (event.fields || []).join(', ') || 'Fields' },
    { key: 'event:subfields', label: 'Subfields', category: 'Event', source: 'event', previewText: (event.subfields || []).join(', ') || 'Subfields' },
    { key: 'event:dates', label: 'Dates', category: 'Event', source: 'event', previewText: formatEventDates(event) || 'Event dates' },
    { key: 'event:partners', label: 'Partners', category: 'Event', source: 'event', previewText: partners || 'Partners' },
    {
      key: 'event:registrationDeadline',
      label: 'Registration deadline',
      category: 'Event',
      source: 'event',
      previewText: formatEventDate(event.registrationDeadline) || 'Registration deadline',
    },
    {
      key: 'event:submissionDeadline',
      label: 'Submission deadline',
      category: 'Event',
      source: 'event',
      previewText: formatEventDate(event.submissionDeadline) || 'Submission deadline',
    },
  ];
}

function collectFormFields(
  form: RegistrationForm,
  source: 'registration' | 'submission'
): CertificateInsertableField[] {
  const fields: CertificateInsertableField[] = [];
  const formTitle = form.title.replace(/^(Reg|Sub)\s*/i, '').trim() || form.title;
  const prefix = `${source}:${form.id}`;

  if (form.generalInfo.collectName) {
    fields.push({
      key: `${prefix}:general_name`,
      label: 'Full name',
      category: formTitle,
      source,
      previewText: 'Participant name',
    });
  }
  if (form.generalInfo.collectEmail) {
    fields.push({
      key: `${prefix}:general_email`,
      label: 'Email',
      category: formTitle,
      source,
      previewText: 'email@example.com',
    });
  }
  if (form.generalInfo.collectPhone) {
    fields.push({
      key: `${prefix}:general_phone`,
      label: 'Phone',
      category: formTitle,
      source,
      previewText: '+1 234 567 890',
    });
  }
  if (form.generalInfo.collectOrganization) {
    fields.push({
      key: `${prefix}:general_organization`,
      label: 'Organization',
      category: formTitle,
      source,
      previewText: 'Organization',
    });
  }
  if (form.generalInfo.collectAddress) {
    fields.push({
      key: `${prefix}:general_address`,
      label: 'Address',
      category: formTitle,
      source,
      previewText: 'Address',
    });
  }

  const pushField = (field: { id: string; label: string }, category: string) => {
    fields.push({
      key: `${prefix}:${field.id}`,
      label: field.label,
      category,
      source,
      previewText: field.label,
    });
  };

  form.sections.forEach((section) => {
    section.fields.forEach((field) => pushField(field, `${formTitle} — ${section.title || 'Fields'}`));
    section.subsections.forEach((subsection) => {
      subsection.fields.forEach((field) =>
        pushField(field, `${formTitle} — ${section.title || 'Section'} / ${subsection.title || 'Subsection'}`)
      );
    });
  });

  form.fields.forEach((field) => pushField(field, `${formTitle} — Form fields`));

  return fields;
}

export function buildRegistrationCertificateFields(
  event: Event,
  forms: RegistrationForm[]
): CertificateInsertableField[] {
  const ids = event.registrationFormIds || [];
  return forms.filter((f) => ids.includes(f.id)).flatMap((f) => collectFormFields(f, 'registration'));
}

export function buildSubmissionCertificateFields(
  event: Event,
  forms: RegistrationForm[]
): CertificateInsertableField[] {
  const ids = new Set([
    ...(event.submissionFormIds || []),
    ...(event.abstractSubmissionFormIds || []),
  ]);
  return forms.filter((f) => ids.has(f.id)).flatMap((f) => collectFormFields(f, 'submission'));
}

/** Legacy general-info shortcuts still supported in older templates. */
const LEGACY_GENERAL: Record<string, string[]> = {
  name: ['general_name'],
  email: ['general_email'],
  phone: ['general_phone'],
  organization: ['general_organization'],
  address: ['general_address'],
};

function answerFromSubmission(submission: FormSubmission, fieldId: string): string {
  if (fieldId === 'general_name') {
    return submission.generalInfo?.name || String(submission.answers['general_name'] ?? '') || submission.submittedBy || '';
  }
  if (fieldId === 'general_email') {
    return submission.generalInfo?.email || String(submission.answers['general_email'] ?? '') || '';
  }
  if (fieldId === 'general_phone') {
    return submission.generalInfo?.phone || String(submission.answers['general_phone'] ?? '') || '';
  }
  if (fieldId === 'general_organization') {
    return submission.generalInfo?.organization || String(submission.answers['general_organization'] ?? '') || '';
  }
  if (fieldId === 'general_address') {
    return submission.generalInfo?.address || String(submission.answers['general_address'] ?? '') || '';
  }

  const value = submission.answers[fieldId];
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function resolveEventField(event: Event, field: string): string {
  switch (field) {
    case 'name':
      return event.name || '';
    case 'description':
      return event.description || '';
    case 'location':
      return event.location || '';
    case 'eventType':
      return event.eventType || '';
    case 'eventFormat':
      return event.eventFormat || '';
    case 'keywords':
      return (event.keywords || []).join(', ');
    case 'fields':
      return (event.fields || []).join(', ');
    case 'subfields':
      return (event.subfields || []).join(', ');
    case 'dates':
      return formatEventDates(event);
    case 'partners':
      return (event.partners || []).map((p) => p.name).filter(Boolean).join(', ');
    case 'registrationDeadline':
      return formatEventDate(event.registrationDeadline);
    case 'submissionDeadline':
      return formatEventDate(event.submissionDeadline);
    default:
      return '';
  }
}

/**
 * Resolve a certificate template field key at generation time.
 * Keys: event:name | registration:{formId}:general_email | submission:{formId}:{fieldId} | legacy name/email/…
 */
export function resolveCertificateFieldValue(
  fieldKey: string,
  submission: FormSubmission,
  event?: Event | null
): string {
  if (fieldKey.startsWith('event:')) {
    if (!event) return '';
    return resolveEventField(event, fieldKey.slice('event:'.length));
  }

  const scopedMatch = fieldKey.match(/^(registration|submission):([^:]+):(.+)$/);
  if (scopedMatch) {
    const [, , formId, answerKey] = scopedMatch;
    if (submission.formId !== formId) {
      // Same participant data may live on a different row; still read answers by key
    }
    return answerFromSubmission(submission, answerKey);
  }

  if (LEGACY_GENERAL[fieldKey]) {
    for (const alt of LEGACY_GENERAL[fieldKey]) {
      const v = answerFromSubmission(submission, alt);
      if (v) return v;
    }
    return answerFromSubmission(submission, fieldKey);
  }

  return answerFromSubmission(submission, fieldKey);
}

export function getCertificateFieldPreviewText(
  fieldKey: string,
  fieldLabel?: string,
  catalog?: CertificateInsertableField[]
): string {
  const fromCatalog = catalog?.find((f) => f.key === fieldKey);
  if (fromCatalog) return fromCatalog.previewText;
  if (fieldLabel) return fieldLabel;
  if (fieldKey.startsWith('event:')) return fieldKey.replace('event:', '').replace(/([A-Z])/g, ' $1');
  return fieldKey;
}

export function findCertificateFieldLabel(
  fieldKey: string,
  fieldLabel?: string,
  catalog?: CertificateInsertableField[]
): string {
  if (fieldLabel) return fieldLabel;
  const fromCatalog = catalog?.find((f) => f.key === fieldKey);
  if (fromCatalog) return fromCatalog.label;
  return fieldKey;
}
