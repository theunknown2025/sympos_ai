import { supabase, TABLES } from '../supabase';
import type { DispatchingStatus } from '../types';
import { getDispatchSubmission, getUserDispatchSubmissions } from './dispatchService';
import { getReviewsForSubmission } from './reviewService';
import { patchSubmissionDispatchingFields } from './registrationSubmissionService';

function parseEvaluationFormIds(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Updates `form_submissions.dispatching_status` and `pipeline_reviewers_expected` from
 * dispatch_submissions + participant_reviews (organizer context).
 */
export async function syncArticleDispatchingProgressForSubmission(params: {
  organizerUserId: string;
  eventId: string;
  articleFormId: string;
  submissionId: string;
}): Promise<void> {
  const { organizerUserId, eventId, articleFormId, submissionId } = params;

  const { data: row, error: rowErr } = await supabase
    .from(TABLES.FORM_SUBMISSIONS)
    .select('id, form_id')
    .eq('id', submissionId)
    .maybeSingle();
  if (rowErr || !row?.id || row.form_id !== articleFormId) {
    return;
  }

  const { data: eventRow } = await supabase
    .from(TABLES.EVENTS)
    .select('evaluation_form_ids, submission_workflow_preset')
    .eq('id', eventId)
    .maybeSingle();

  const evalIds = parseEvaluationFormIds(eventRow?.evaluation_form_ids);
  const preset = (eventRow?.submission_workflow_preset as string) || 'A';
  /** Presets B/D with no evaluation forms: no peer-review rows; treat review phase as satisfied once dispatched. */
  const skipPeerReviewsBecauseNoEvalForms =
    (preset === 'B' || preset === 'D') && evalIds.length === 0;

  const dispatch = await getDispatchSubmission(organizerUserId, eventId, articleFormId);
  const rawAssignees = dispatch?.dispatching?.[submissionId];
  const assignees = Array.isArray(rawAssignees) ? rawAssignees.filter(Boolean) : [];

  if (assignees.length === 0) {
    await patchSubmissionDispatchingFields(submissionId, {
      dispatchingStatus: null,
      pipelineReviewersExpected: null,
    });
    return;
  }

  const reviews = await getReviewsForSubmission(submissionId);
  const completed = new Set(
    reviews.filter((r) => r.status === 'completed').map((r) => r.participantId)
  );
  const doneCount = assignees.filter((id) => completed.has(id)).length;

  let status: DispatchingStatus;
  if (skipPeerReviewsBecauseNoEvalForms) {
    status = 'completed';
  } else if (doneCount >= assignees.length) {
    status = 'completed';
  } else if (doneCount > 0) {
    status = 'in_review';
  } else {
    status = 'dispatched';
  }

  await patchSubmissionDispatchingFields(submissionId, {
    dispatchingStatus: status,
    pipelineReviewersExpected: assignees.length,
  });
}

/** After saving dispatch_submissions, refresh linked article rows. */
export async function syncAfterDispatchTableSaved(params: {
  organizerUserId: string;
  eventId: string;
  formId: string;
  dispatching: Record<string, string[]>;
  previousDispatching: Record<string, string[]>;
}): Promise<void> {
  const ids = new Set([
    ...Object.keys(params.dispatching || {}),
    ...Object.keys(params.previousDispatching || {}),
  ]);
  for (const submissionId of ids) {
    await syncArticleDispatchingProgressForSubmission({
      organizerUserId: params.organizerUserId,
      eventId: params.eventId,
      articleFormId: params.formId,
      submissionId,
    });
  }
}

/**
 * Best-effort sync after a reviewer saves a review (may fail under RLS; organizer resync fixes it).
 */
export async function syncArticleDispatchingProgressBySubmissionId(submissionId: string): Promise<void> {
  try {
    const { data: row, error } = await supabase
      .from(TABLES.FORM_SUBMISSIONS)
      .select('id, form_id, event_id, accepted_event_id')
      .eq('id', submissionId)
      .maybeSingle();
    if (error || !row) return;

    const eventKey = row.accepted_event_id || row.event_id;
    const { data: ev, error: evErr } = await supabase
      .from(TABLES.EVENTS)
      .select('id, user_id, evaluation_form_ids, submission_form_ids, submission_workflow_preset')
      .eq('id', eventKey)
      .maybeSingle();
    if (evErr || !ev?.user_id) return;

    const submissionFormIds = Array.isArray(ev.submission_form_ids)
      ? ev.submission_form_ids
      : typeof ev.submission_form_ids === 'string'
        ? (() => {
            try {
              return JSON.parse(ev.submission_form_ids) as string[];
            } catch {
              return [];
            }
          })()
        : [];
    if (!submissionFormIds.includes(row.form_id)) return;

    const evalIds = parseEvaluationFormIds(ev.evaluation_form_ids);
    const preset = (ev.submission_workflow_preset as string) || 'A';
    const allowSyncWithoutEvalForms = preset === 'B' || preset === 'D';
    if (!evalIds.length && !allowSyncWithoutEvalForms) return;

    await syncArticleDispatchingProgressForSubmission({
      organizerUserId: ev.user_id,
      eventId: ev.id,
      articleFormId: row.form_id,
      submissionId,
    });
  } catch (e) {
    console.warn('[syncArticleDispatchingProgressBySubmissionId]', e);
  }
}

/** Refresh all dispatch-linked article rows for this organizer (e.g. Evaluation tab load). */
export async function resyncAllDispatchProgressForOrganizer(organizerUserId: string): Promise<void> {
  const dispatches = await getUserDispatchSubmissions(organizerUserId);
  for (const d of dispatches) {
    const keys = Object.keys(d.dispatching || {});
    for (const submissionId of keys) {
      await syncArticleDispatchingProgressForSubmission({
        organizerUserId,
        eventId: d.eventId,
        articleFormId: d.formId,
        submissionId,
      });
    }
  }
}
