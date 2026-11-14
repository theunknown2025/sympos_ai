-- Submission modification workflow: rounds, questions, files, and storage bucket
-- Applied via Supabase migration: create_submission_modifications

CREATE TABLE IF NOT EXISTS public.submission_modification_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.form_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.committee_members(id) ON DELETE CASCADE,
  evaluation_form_id UUID NOT NULL,
  event_id TEXT NOT NULL,
  round_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending_organizer'
    CHECK (status IN (
      'pending_organizer',
      'awaiting_participant',
      'participant_submitted',
      'reviewer_approved',
      'rejected_all'
    )),
  submitted_at TIMESTAMPTZ,
  organizer_reviewed_at TIMESTAMPTZ,
  participant_submitted_at TIMESTAMPTZ,
  reviewer_closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_mod_rounds_submission_id
  ON public.submission_modification_rounds(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_mod_rounds_reviewer_id
  ON public.submission_modification_rounds(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_submission_mod_rounds_status
  ON public.submission_modification_rounds(status);
CREATE INDEX IF NOT EXISTS idx_submission_mod_rounds_event_id
  ON public.submission_modification_rounds(event_id);

CREATE TABLE IF NOT EXISTS public.submission_modification_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.submission_modification_rounds(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  concerned_section TEXT NOT NULL DEFAULT '',
  question_text TEXT NOT NULL DEFAULT '',
  organizer_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (organizer_status IN ('pending', 'approved', 'rejected')),
  organizer_decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organizer_decided_at TIMESTAMPTZ,
  answer_text TEXT,
  participant_answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_mod_questions_round_id
  ON public.submission_modification_questions(round_id);
CREATE INDEX IF NOT EXISTS idx_submission_mod_questions_organizer_status
  ON public.submission_modification_questions(organizer_status);

CREATE TABLE IF NOT EXISTS public.submission_modification_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.submission_modification_rounds(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_mod_files_round_id
  ON public.submission_modification_files(round_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submission-modification-files',
  'submission-modification-files',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload modification files" ON storage.objects;
CREATE POLICY "Authenticated users can upload modification files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'submission-modification-files');

DROP POLICY IF EXISTS "Authenticated users can read modification files" ON storage.objects;
CREATE POLICY "Authenticated users can read modification files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'submission-modification-files');

DROP POLICY IF EXISTS "Authenticated users can update modification files" ON storage.objects;
CREATE POLICY "Authenticated users can update modification files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'submission-modification-files')
  WITH CHECK (bucket_id = 'submission-modification-files');

DROP POLICY IF EXISTS "Authenticated users can delete modification files" ON storage.objects;
CREATE POLICY "Authenticated users can delete modification files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'submission-modification-files');
