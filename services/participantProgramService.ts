import type { Event, FormSubmission } from '../types';
import type { SavedProgram } from './programService';
import { getProgramById } from './programService';
import {
  formatParticipantProgramSlotSummary,
  getParticipantSubmissionIdsForProgram,
} from './submissionPipelineService';

/** Loads the program the organizer linked on the event (`publishedProgramId`). */
export async function fetchPublishedProgramForEvent(event: Event): Promise<SavedProgram | null> {
  const id = event.publishedProgramId?.trim();
  if (!id) return null;
  return getProgramById(id);
}

/** One-line schedule summary for this participant on the published program, if their submission is on a card. */
export function getParticipantPlanningSummaryLine(
  event: Event,
  subs: FormSubmission[],
  program: SavedProgram
): string | undefined {
  const ids = getParticipantSubmissionIdsForProgram(event, subs);
  return formatParticipantProgramSlotSummary(program, ids);
}
