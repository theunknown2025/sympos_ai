import { useEffect, useMemo, useState } from 'react';
import type { Event, FormSubmission } from '../types';
import type { SavedProgram } from '../services/programService';
import { getProgramById } from '../services/programService';
import {
  buildParticipantPipelineTimeline,
  type PipelineStepUi,
} from '../services/submissionPipelineService';

/**
 * Participant submission steps (abstract / article / payment / program), including
 * loading the published program when `event.publishedProgramId` is set.
 * Pass `enabled: false` to skip program fetch until the section is expanded.
 */
export function useParticipantSubmissionTimeline(
  event: Event,
  mySubmissions: FormSubmission[],
  enabled = true
): { steps: PipelineStepUi[]; publishedProgram: SavedProgram | null; programLoading: boolean } {
  const [publishedProgram, setPublishedProgram] = useState<SavedProgram | null>(null);
  const [programLoading, setProgramLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setPublishedProgram(null);
      setProgramLoading(false);
      return;
    }

    if (!event.publishedProgramId || !event.submissionFormIds?.length) {
      setPublishedProgram(null);
      setProgramLoading(false);
      return;
    }
    let cancelled = false;
    setProgramLoading(true);
    getProgramById(event.publishedProgramId)
      .then((p) => {
        if (!cancelled) {
          setPublishedProgram(p);
          setProgramLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPublishedProgram(null);
          setProgramLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, event.id, event.publishedProgramId, event.submissionFormIds?.length]);

  const steps = useMemo(() => {
    if (!enabled) {
      return buildParticipantPipelineTimeline(event, mySubmissions, {
        publishedProgram: null,
        programLoading: false,
      });
    }
    return buildParticipantPipelineTimeline(event, mySubmissions, {
      publishedProgram,
      programLoading,
    });
  }, [enabled, event, mySubmissions, publishedProgram, programLoading]);

  return { steps, publishedProgram, programLoading };
}
