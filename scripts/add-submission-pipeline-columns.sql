-- Submission pipeline (abstract → article → payment) for multi-step workflows.
-- Run in Supabase SQL Editor once.

ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS submission_pipeline_kind TEXT
    CHECK (submission_pipeline_kind IS NULL OR submission_pipeline_kind IN ('abstract', 'article', 'payment'));

ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS submission_pipeline_group_id UUID;

ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS parent_submission_id UUID REFERENCES form_submissions(id) ON DELETE SET NULL;

ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS submission_payment_completed BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_form_submissions_pipeline_group
  ON form_submissions(submission_pipeline_group_id)
  WHERE submission_pipeline_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_form_submissions_parent
  ON form_submissions(parent_submission_id)
  WHERE parent_submission_id IS NOT NULL;

COMMENT ON COLUMN form_submissions.submission_pipeline_kind IS 'abstract | article | payment — payment rows link to article via parent_submission_id.';
COMMENT ON COLUMN form_submissions.submission_pipeline_group_id IS 'Links abstract and article (and payment flag on article row) for one participant submission flow.';
COMMENT ON COLUMN form_submissions.parent_submission_id IS 'Article submission references accepted abstract submission.';
COMMENT ON COLUMN form_submissions.submission_payment_completed IS 'Organizer marks payment received (workflow B/D), stored on article submission row.';
