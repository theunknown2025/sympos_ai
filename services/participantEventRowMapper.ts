import type { Event, EventDate, EventLink, EventPartner } from '../types';
import { mapEventTemplateFields } from './eventTemplateFields';

/** Columns needed for participant event cards and submission actions. */
export const PARTICIPANT_EVENT_LIST_COLUMNS = `
  id,
  user_id,
  campus_id,
  name,
  description,
  keywords,
  fields,
  subfields,
  event_type,
  event_format,
  dates,
  location,
  registration_form_ids,
  registration_form_id,
  submission_form_ids,
  submission_form_id,
  abstract_submission_form_ids,
  evaluation_form_ids,
  certificate_template_ids,
  badge_template_ids,
  registration_badge_template_ids,
  registration_certificate_template_ids,
  submission_badge_template_ids,
  submission_certificate_template_ids,
  committee_ids,
  evaluation_enabled,
  publish_status,
  public_slug,
  registration_deadline,
  submission_deadline,
  abstract_submission_deadline,
  submission_workflow_preset,
  payment_deadline,
  submission_payment_offer_id,
  submission_payment_form_id,
  published_program_id,
  created_at,
  updated_at
`.replace(/\s+/g, ' ');

const deserializeArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const getArrayOrFallback = (newColumnValue: unknown, oldColumnValue: unknown): string[] => {
  const newArray = deserializeArray(newColumnValue);
  if (newArray.length > 0) {
    return newArray as string[];
  }
  if (oldColumnValue) {
    return [String(oldColumnValue)];
  }
  return [];
};

/** Map a slim events row for participant listing (cards, filters, pipeline actions). */
export const mapParticipantEventRow = (eventData: Record<string, unknown>): Event => ({
  id: String(eventData.id),
  userId: String(eventData.user_id),
  campusId: eventData.campus_id ? String(eventData.campus_id) : undefined,
  name: String(eventData.name),
  description: eventData.description ? String(eventData.description) : undefined,
  keywords: deserializeArray(eventData.keywords) as string[],
  fields: deserializeArray(eventData.fields) as string[],
  subfields: deserializeArray(eventData.subfields) as string[],
  eventType: eventData.event_type as Event['eventType'],
  eventFormat: eventData.event_format as Event['eventFormat'],
  partners: [] as EventPartner[],
  dates: deserializeArray(eventData.dates) as EventDate[],
  location: eventData.location ? String(eventData.location) : undefined,
  links: [] as EventLink[],
  landingPageIds: getArrayOrFallback(eventData.landing_page_ids, eventData.landing_page_id),
  registrationFormIds: getArrayOrFallback(
    eventData.registration_form_ids,
    eventData.registration_form_id
  ),
  submissionFormIds: getArrayOrFallback(
    eventData.submission_form_ids,
    eventData.submission_form_id
  ),
  evaluationFormIds: deserializeArray(eventData.evaluation_form_ids) as string[],
  ...mapEventTemplateFields(eventData),
  committeeIds: deserializeArray(eventData.committee_ids) as string[],
  evaluationEnabled: Boolean(eventData.evaluation_enabled),
  publishStatus: (eventData.publish_status as Event['publishStatus']) || 'Draft',
  publicSlug: eventData.public_slug ? String(eventData.public_slug) : undefined,
  registrationDeadline: eventData.registration_deadline
    ? String(eventData.registration_deadline)
    : undefined,
  submissionDeadline: eventData.submission_deadline
    ? String(eventData.submission_deadline)
    : undefined,
  submissionWorkflowPreset: (eventData.submission_workflow_preset as Event['submissionWorkflowPreset']) ||
    undefined,
  abstractSubmissionFormIds: deserializeArray(eventData.abstract_submission_form_ids) as string[],
  abstractSubmissionDeadline: eventData.abstract_submission_deadline
    ? String(eventData.abstract_submission_deadline)
    : undefined,
  paymentDeadline: eventData.payment_deadline ? String(eventData.payment_deadline) : undefined,
  submissionPaymentOfferId: eventData.submission_payment_offer_id
    ? String(eventData.submission_payment_offer_id)
    : undefined,
  submissionPaymentFormId: eventData.submission_payment_form_id
    ? String(eventData.submission_payment_form_id)
    : undefined,
  publishedProgramId: eventData.published_program_id
    ? String(eventData.published_program_id)
    : undefined,
  createdAt: new Date(String(eventData.created_at)),
  updatedAt: new Date(String(eventData.updated_at)),
});

export const isPublishedParticipantEvent = (event: Event): boolean =>
  event.publishStatus === 'Published' || event.publishStatus === 'Closed';
