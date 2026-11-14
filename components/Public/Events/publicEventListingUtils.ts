import type { Event } from '../../../types';
import {
  getEventPublicUrl,
  isEventRegistrationDeadlinePassed,
  isEventSubmissionDeadlinePassed,
} from '../../../services/eventService';

export const PUBLIC_EVENTS_BROWSE_PATH = '/events/browse';

export function publicEventExploreUrl(event: Event): string {
  return event.publicSlug ? getEventPublicUrl(event.publicSlug) : '#';
}

export function publicEventRegisterUrl(event: Event): string {
  const base = publicEventExploreUrl(event);
  return base === '#' ? '#' : `${base}?register=1`;
}

export function publicEventSubmitUrl(event: Event): string {
  const base = publicEventExploreUrl(event);
  return base === '#' ? '#' : `${base}?submit=1`;
}

export function canPublicRegister(event: Event): boolean {
  return (
    event.publishStatus === 'Published' &&
    !!event.publicSlug &&
    !!event.registrationFormIds?.length &&
    !isEventRegistrationDeadlinePassed(event)
  );
}

export function canPublicSubmit(event: Event): boolean {
  return (
    event.publishStatus === 'Published' &&
    !!event.publicSlug &&
    !!event.submissionFormIds?.length &&
    !isEventSubmissionDeadlinePassed(event)
  );
}
