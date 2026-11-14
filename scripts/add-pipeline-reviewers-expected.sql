-- Peer-review progress for article submissions (used with dispatch + participant_reviews).
-- Run in Supabase SQL Editor once.

ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS pipeline_reviewers_expected INTEGER;

COMMENT ON COLUMN form_submissions.pipeline_reviewers_expected IS
  'Number of committee reviewers assigned in dispatch for this article; used with dispatching_status for participant gating.';
