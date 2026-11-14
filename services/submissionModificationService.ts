import { supabase, TABLES, STORAGE_BUCKETS } from '../supabase';
import {
  ModificationQuestionOrganizerStatus,
  ModificationRoundStatus,
  SubmissionModificationFile,
  SubmissionModificationQuestion,
  SubmissionModificationRound,
} from '../types';

const ROUNDS_TABLE = TABLES.SUBMISSION_MODIFICATION_ROUNDS;
const QUESTIONS_TABLE = TABLES.SUBMISSION_MODIFICATION_QUESTIONS;
const FILES_TABLE = TABLES.SUBMISSION_MODIFICATION_FILES;

const ACTIVE_ROUND_STATUSES: ModificationRoundStatus[] = [
  'pending_organizer',
  'awaiting_participant',
  'participant_submitted',
];

type DbRound = {
  id: string;
  submission_id: string;
  reviewer_id: string;
  evaluation_form_id: string;
  event_id: string;
  round_number: number;
  status: ModificationRoundStatus;
  submitted_at: string | null;
  organizer_reviewed_at: string | null;
  participant_submitted_at: string | null;
  reviewer_closed_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbQuestion = {
  id: string;
  round_id: string;
  sort_order: number;
  concerned_section: string;
  question_text: string;
  organizer_status: ModificationQuestionOrganizerStatus;
  organizer_decided_by: string | null;
  organizer_decided_at: string | null;
  answer_text: string | null;
  participant_answered_at: string | null;
  created_at: string;
};

type DbFile = {
  id: string;
  round_id: string;
  file_url: string;
  file_name: string;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
};

const mapQuestion = (row: DbQuestion): SubmissionModificationQuestion => ({
  id: row.id,
  roundId: row.round_id,
  sortOrder: row.sort_order,
  concernedSection: row.concerned_section,
  questionText: row.question_text,
  organizerStatus: row.organizer_status,
  organizerDecidedBy: row.organizer_decided_by ?? undefined,
  organizerDecidedAt: row.organizer_decided_at ? new Date(row.organizer_decided_at) : undefined,
  answerText: row.answer_text ?? undefined,
  participantAnsweredAt: row.participant_answered_at ? new Date(row.participant_answered_at) : undefined,
  createdAt: new Date(row.created_at),
});

const mapFile = (row: DbFile): SubmissionModificationFile => ({
  id: row.id,
  roundId: row.round_id,
  fileUrl: row.file_url,
  fileName: row.file_name,
  storagePath: row.storage_path,
  uploadedBy: row.uploaded_by,
  createdAt: new Date(row.created_at),
});

const mapRound = (row: DbRound): SubmissionModificationRound => ({
  id: row.id,
  submissionId: row.submission_id,
  reviewerId: row.reviewer_id,
  evaluationFormId: row.evaluation_form_id,
  eventId: row.event_id,
  roundNumber: row.round_number,
  status: row.status,
  submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
  organizerReviewedAt: row.organizer_reviewed_at ? new Date(row.organizer_reviewed_at) : undefined,
  participantSubmittedAt: row.participant_submitted_at ? new Date(row.participant_submitted_at) : undefined,
  reviewerClosedAt: row.reviewer_closed_at ? new Date(row.reviewer_closed_at) : undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

async function loadQuestionsForRounds(roundIds: string[]): Promise<Map<string, SubmissionModificationQuestion[]>> {
  const map = new Map<string, SubmissionModificationQuestion[]>();
  if (roundIds.length === 0) return map;

  const { data, error } = await supabase
    .from(QUESTIONS_TABLE)
    .select('*')
    .in('round_id', roundIds)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  for (const row of (data ?? []) as DbQuestion[]) {
    const list = map.get(row.round_id) ?? [];
    list.push(mapQuestion(row));
    map.set(row.round_id, list);
  }
  return map;
}

async function loadFilesForRounds(roundIds: string[]): Promise<Map<string, SubmissionModificationFile[]>> {
  const map = new Map<string, SubmissionModificationFile[]>();
  if (roundIds.length === 0) return map;

  const { data, error } = await supabase
    .from(FILES_TABLE)
    .select('*')
    .in('round_id', roundIds)
    .order('created_at', { ascending: true });

  if (error) throw error;

  for (const row of (data ?? []) as DbFile[]) {
    const list = map.get(row.round_id) ?? [];
    list.push(mapFile(row));
    map.set(row.round_id, list);
  }
  return map;
}

async function enrichRounds(rows: DbRound[]): Promise<SubmissionModificationRound[]> {
  const roundIds = rows.map((r) => r.id);
  const [questionsMap, filesMap] = await Promise.all([
    loadQuestionsForRounds(roundIds),
    loadFilesForRounds(roundIds),
  ]);

  return rows.map((row) => ({
    ...mapRound(row),
    questions: questionsMap.get(row.id) ?? [],
    files: filesMap.get(row.id) ?? [],
  }));
}

export async function getRoundsForSubmission(submissionId: string): Promise<SubmissionModificationRound[]> {
  const { data, error } = await supabase
    .from(ROUNDS_TABLE)
    .select('*')
    .eq('submission_id', submissionId)
    .order('round_number', { ascending: true });

  if (error) throw error;
  return enrichRounds((data ?? []) as DbRound[]);
}

export async function getRoundsForReviewer(
  submissionId: string,
  reviewerId: string
): Promise<SubmissionModificationRound[]> {
  const { data, error } = await supabase
    .from(ROUNDS_TABLE)
    .select('*')
    .eq('submission_id', submissionId)
    .eq('reviewer_id', reviewerId)
    .order('round_number', { ascending: true });

  if (error) throw error;
  return enrichRounds((data ?? []) as DbRound[]);
}

export async function getPendingOrganizerRounds(eventIds: string[]): Promise<SubmissionModificationRound[]> {
  let query = supabase
    .from(ROUNDS_TABLE)
    .select('*')
    .eq('status', 'pending_organizer')
    .order('submitted_at', { ascending: false });

  if (eventIds.length > 0) {
    query = query.in('event_id', eventIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  return enrichRounds((data ?? []) as DbRound[]);
}

export async function getAwaitingParticipantRounds(submissionId: string): Promise<SubmissionModificationRound[]> {
  const { data, error } = await supabase
    .from(ROUNDS_TABLE)
    .select('*')
    .eq('submission_id', submissionId)
    .eq('status', 'awaiting_participant')
    .order('round_number', { ascending: true });

  if (error) throw error;
  return enrichRounds((data ?? []) as DbRound[]);
}

export async function getActiveRoundForReviewer(
  submissionId: string,
  reviewerId: string
): Promise<SubmissionModificationRound | null> {
  const { data, error } = await supabase
    .from(ROUNDS_TABLE)
    .select('*')
    .eq('submission_id', submissionId)
    .eq('reviewer_id', reviewerId)
    .in('status', ACTIVE_ROUND_STATUSES)
    .order('round_number', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const enriched = await enrichRounds(data as DbRound[]);
  return enriched[0] ?? null;
}

export async function canReviewerSubmitEvaluation(
  submissionId: string,
  reviewerId: string
): Promise<boolean> {
  const active = await getActiveRoundForReviewer(submissionId, reviewerId);
  return active === null;
}

export interface ModificationQuestionDraft {
  concernedSection: string;
  questionText: string;
}

export async function submitModificationRound(params: {
  submissionId: string;
  reviewerId: string;
  evaluationFormId: string;
  eventId: string;
  questions: ModificationQuestionDraft[];
}): Promise<string> {
  const { submissionId, reviewerId, evaluationFormId, eventId, questions } = params;

  if (questions.length === 0) {
    throw new Error('At least one question is required');
  }

  const validQuestions = questions.filter(
    (q) => q.concernedSection.trim() || q.questionText.trim()
  );
  if (validQuestions.length === 0) {
    throw new Error('At least one question with content is required');
  }

  const active = await getActiveRoundForReviewer(submissionId, reviewerId);
  if (active) {
    if (active.status === 'participant_submitted') {
      await approveModificationsByReviewer(active.id);
    } else {
      throw new Error('An active modification round already exists');
    }
  }

  const { data: existingRounds, error: countError } = await supabase
    .from(ROUNDS_TABLE)
    .select('round_number')
    .eq('submission_id', submissionId)
    .eq('reviewer_id', reviewerId)
    .order('round_number', { ascending: false })
    .limit(1);

  if (countError) throw countError;

  const nextRoundNumber =
    existingRounds && existingRounds.length > 0
      ? (existingRounds[0] as { round_number: number }).round_number + 1
      : 1;

  const now = new Date().toISOString();

  const { data: roundRow, error: roundError } = await supabase
    .from(ROUNDS_TABLE)
    .insert({
      submission_id: submissionId,
      reviewer_id: reviewerId,
      evaluation_form_id: evaluationFormId,
      event_id: eventId,
      round_number: nextRoundNumber,
      status: 'pending_organizer',
      submitted_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (roundError) throw roundError;

  const roundId = (roundRow as { id: string }).id;

  const questionRows = validQuestions.map((q, index) => ({
    round_id: roundId,
    sort_order: index,
    concerned_section: q.concernedSection.trim(),
    question_text: q.questionText.trim(),
    organizer_status: 'pending' as ModificationQuestionOrganizerStatus,
  }));

  const { error: questionsError } = await supabase.from(QUESTIONS_TABLE).insert(questionRows);
  if (questionsError) throw questionsError;

  return roundId;
}

export async function decideModificationQuestion(
  questionId: string,
  status: ModificationQuestionOrganizerStatus,
  organizerUserId: string
): Promise<void> {
  const { error } = await supabase
    .from(QUESTIONS_TABLE)
    .update({
      organizer_status: status,
      organizer_decided_by: organizerUserId,
      organizer_decided_at: new Date().toISOString(),
    })
    .eq('id', questionId);

  if (error) throw error;
}

export async function bulkDecideModificationQuestions(
  roundId: string,
  status: ModificationQuestionOrganizerStatus,
  organizerUserId: string
): Promise<void> {
  const { error } = await supabase
    .from(QUESTIONS_TABLE)
    .update({
      organizer_status: status,
      organizer_decided_by: organizerUserId,
      organizer_decided_at: new Date().toISOString(),
    })
    .eq('round_id', roundId)
    .eq('organizer_status', 'pending');

  if (error) throw error;
}

export async function finalizeOrganizerReview(roundId: string): Promise<ModificationRoundStatus> {
  const { data: questions, error: qError } = await supabase
    .from(QUESTIONS_TABLE)
    .select('organizer_status')
    .eq('round_id', roundId);

  if (qError) throw qError;

  const rows = (questions ?? []) as { organizer_status: ModificationQuestionOrganizerStatus }[];
  const hasPending = rows.some((q) => q.organizer_status === 'pending');
  if (hasPending) {
    throw new Error('All questions must be approved or rejected before finalizing');
  }

  const approvedCount = rows.filter((q) => q.organizer_status === 'approved').length;
  const newStatus: ModificationRoundStatus =
    approvedCount > 0 ? 'awaiting_participant' : 'rejected_all';

  const { error } = await supabase
    .from(ROUNDS_TABLE)
    .update({
      status: newStatus,
      organizer_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', roundId);

  if (error) throw error;
  return newStatus;
}

export async function uploadModificationFile(
  userId: string,
  submissionId: string,
  roundId: string,
  file: File
): Promise<{ fileUrl: string; storagePath: string; fileName: string }> {
  const lastDot = file.name.lastIndexOf('.');
  const fileExt =
    lastDot > 0 && lastDot < file.name.length - 1
      ? file.name.slice(lastDot + 1).toLowerCase().replace(/[^a-z0-9]/gi, '') || 'bin'
      : 'bin';
  const storagePath = `${submissionId}/${roundId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const inferContentType = (): string => {
    if (file.type && file.type.length > 0) return file.type;
    if (fileExt === 'pdf') return 'application/pdf';
    if (fileExt === 'doc') return 'application/msword';
    if (fileExt === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    return 'application/octet-stream';
  };

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.SUBMISSION_MODIFICATION_FILES)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: inferContentType(),
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.SUBMISSION_MODIFICATION_FILES)
    .getPublicUrl(storagePath);

  return {
    fileUrl: urlData.publicUrl,
    storagePath,
    fileName: file.name,
  };
}

export async function submitParticipantModifications(params: {
  roundId: string;
  submissionId: string;
  userId: string;
  answers: { questionId: string; answerText: string }[];
  file?: File;
}): Promise<void> {
  const { roundId, submissionId, userId, answers, file } = params;
  const now = new Date().toISOString();

  for (const { questionId, answerText } of answers) {
    const { error } = await supabase
      .from(QUESTIONS_TABLE)
      .update({
        answer_text: answerText.trim(),
        participant_answered_at: now,
      })
      .eq('id', questionId)
      .eq('round_id', roundId)
      .eq('organizer_status', 'approved');

    if (error) throw error;
  }

  if (file) {
    const uploaded = await uploadModificationFile(userId, submissionId, roundId, file);
    const { error: fileError } = await supabase.from(FILES_TABLE).insert({
      round_id: roundId,
      file_url: uploaded.fileUrl,
      file_name: uploaded.fileName,
      storage_path: uploaded.storagePath,
      uploaded_by: userId,
    });
    if (fileError) throw fileError;
  }

  const { error: roundError } = await supabase
    .from(ROUNDS_TABLE)
    .update({
      status: 'participant_submitted',
      participant_submitted_at: now,
      updated_at: now,
    })
    .eq('id', roundId)
    .eq('status', 'awaiting_participant');

  if (roundError) throw roundError;
}

export async function approveModificationsByReviewer(roundId: string): Promise<void> {
  const { error } = await supabase
    .from(ROUNDS_TABLE)
    .update({
      status: 'reviewer_approved',
      reviewer_closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', roundId)
    .eq('status', 'participant_submitted');

  if (error) throw error;
}

export function hasBlockingActiveRound(rounds: SubmissionModificationRound[]): boolean {
  return rounds.some((r) => ACTIVE_ROUND_STATUSES.includes(r.status));
}

export function submissionHasAwaitingParticipantRounds(rounds: SubmissionModificationRound[]): boolean {
  return rounds.some((r) => r.status === 'awaiting_participant');
}
