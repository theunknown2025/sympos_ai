import { getEvent, updateEvent } from '../eventService';
import {
  EventResourceSlot,
  EventResourceSlotFullError,
  linkedIdsForSlot,
  slotIsFull,
} from './slots';

const ARRAY_UPDATE: Partial<
  Record<EventResourceSlot, (ids: string[]) => Parameters<typeof updateEvent>[1]>
> = {
  landing_page: (ids) => ({ landingPageIds: ids }),
  registration_form: (ids) => ({ registrationFormIds: ids }),
  submission_form: (ids) => ({ submissionFormIds: ids }),
  abstract_submission_form: (ids) => ({ abstractSubmissionFormIds: ids }),
  evaluation_form: (ids) => ({ evaluationFormIds: ids }),
  registration_certificate: (ids) => ({ registrationCertificateTemplateIds: ids }),
  submission_certificate: (ids) => ({ submissionCertificateTemplateIds: ids }),
  registration_badge: (ids) => ({ registrationBadgeTemplateIds: ids }),
  submission_badge: (ids) => ({ submissionBadgeTemplateIds: ids }),
};

/**
 * Link one resource to an event. A second item of the same kind is rejected.
 */
export async function attachEventResource(
  eventId: string,
  slot: EventResourceSlot,
  resourceId: string
): Promise<void> {
  if (slot === 'project') return;
  const event = await getEvent(eventId);
  if (!event) throw new Error('Event not found');

  const current = linkedIdsForSlot(event, slot);
  if (current.includes(resourceId)) return;
  if (slotIsFull(event, slot)) {
    throw new EventResourceSlotFullError(slot);
  }

  if (slot === 'submission_payment_form') {
    await updateEvent(eventId, { submissionPaymentFormId: resourceId });
    return;
  }

  const build = ARRAY_UPDATE[slot];
  if (!build) return;
  await updateEvent(eventId, build([...current, resourceId]));
}

export async function eventSlotIsFull(eventId: string, slot: EventResourceSlot): Promise<boolean> {
  if (slot === 'project') return false;
  const event = await getEvent(eventId);
  if (!event) return false;
  return slotIsFull(event, slot);
}
