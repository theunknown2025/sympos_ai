import type { Event } from '../../types';

/** One resource of each kind may be linked to a single event. */
export const EVENT_RESOURCE_SLOT_LIMIT = 1;

export type EventResourceSlot =
  | 'landing_page'
  | 'registration_form'
  | 'submission_form'
  | 'abstract_submission_form'
  | 'submission_payment_form'
  | 'evaluation_form'
  | 'registration_certificate'
  | 'submission_certificate'
  | 'registration_badge'
  | 'submission_badge'
  | 'project';

type ArraySlot = Exclude<EventResourceSlot, 'submission_payment_form' | 'project'>;

const ARRAY_SLOT_FIELDS: Record<ArraySlot, keyof Event> = {
  landing_page: 'landingPageIds',
  registration_form: 'registrationFormIds',
  submission_form: 'submissionFormIds',
  abstract_submission_form: 'abstractSubmissionFormIds',
  evaluation_form: 'evaluationFormIds',
  registration_certificate: 'registrationCertificateTemplateIds',
  submission_certificate: 'submissionCertificateTemplateIds',
  registration_badge: 'registrationBadgeTemplateIds',
  submission_badge: 'submissionBadgeTemplateIds',
};

export class EventResourceSlotFullError extends Error {
  readonly code = 'EVENT_RESOURCE_SLOT_FULL';
  readonly slot: EventResourceSlot;

  constructor(slot: EventResourceSlot) {
    super('EVENT_RESOURCE_SLOT_FULL');
    this.name = 'EventResourceSlotFullError';
    this.slot = slot;
  }
}

export function isEventResourceSlotFullError(err: unknown): err is EventResourceSlotFullError {
  return (
    err instanceof EventResourceSlotFullError ||
    (!!err &&
      typeof err === 'object' &&
      (err as { code?: string }).code === 'EVENT_RESOURCE_SLOT_FULL' &&
      typeof (err as { slot?: string }).slot === 'string')
  );
}

function asIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export function linkedIdsForSlot(event: Partial<Event>, slot: EventResourceSlot): string[] {
  if (slot === 'project') return [];
  if (slot === 'submission_payment_form') {
    return event.submissionPaymentFormId ? [event.submissionPaymentFormId] : [];
  }
  const field = ARRAY_SLOT_FIELDS[slot];
  return asIdList(event[field]);
}

export function slotIsFull(event: Partial<Event>, slot: EventResourceSlot): boolean {
  return linkedIdsForSlot(event, slot).length >= EVENT_RESOURCE_SLOT_LIMIT;
}

/** Slots whose incoming list would store more than one item on the event. */
export function overflowingEventSlots(partial: Partial<Event>): EventResourceSlot[] {
  const overflow: EventResourceSlot[] = [];
  (Object.keys(ARRAY_SLOT_FIELDS) as ArraySlot[]).forEach((slot) => {
    const field = ARRAY_SLOT_FIELDS[slot];
    if (partial[field] === undefined) return;
    if (asIdList(partial[field]).length > EVENT_RESOURCE_SLOT_LIMIT) {
      overflow.push(slot);
    }
  });
  return overflow;
}

export function assertEventResourcePayload(partial: Partial<Event>): void {
  const overflow = overflowingEventSlots(partial);
  if (overflow.length > 0) {
    throw new EventResourceSlotFullError(overflow[0]);
  }
}
