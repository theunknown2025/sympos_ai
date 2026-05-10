-- Submission workflow preset and per-stage fields for events (New Event wizard).
-- Run against your Supabase project after backup.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS submission_workflow_preset TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS abstract_submission_form_ids TEXT DEFAULT '[]';

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS abstract_submission_deadline DATE;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS payment_deadline DATE;

COMMENT ON COLUMN events.submission_workflow_preset IS 'A: article only; B: article+pay; C: abstract+article; D: abstract+article+pay';
COMMENT ON COLUMN events.abstract_submission_form_ids IS 'JSON array of form UUIDs for abstract stage (when preset C or D)';
COMMENT ON COLUMN events.abstract_submission_deadline IS 'Deadline for abstract submission when abstract stage is enabled';
COMMENT ON COLUMN events.payment_deadline IS 'Payment deadline when preset includes pay (B or D)';
