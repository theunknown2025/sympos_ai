export {
  EVENT_RESOURCE_SLOT_LIMIT,
  EventResourceSlotFullError,
  assertEventResourcePayload,
  isEventResourceSlotFullError,
  linkedIdsForSlot,
  overflowingEventSlots,
  slotIsFull,
} from './slots';
export type { EventResourceSlot } from './slots';
export { attachEventResource, eventSlotIsFull } from './attachEventResource';
