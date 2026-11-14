-- Speed up participant registration/submission list queries
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_by
  ON form_submissions(submitted_by)
  WHERE submitted_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_participants_badge_form_submission
  ON participants_badge(form_submission_id);
