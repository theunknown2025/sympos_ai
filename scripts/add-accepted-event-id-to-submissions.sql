-- Migration: Add accepted_event_id column to form_submissions table
-- This column tracks which event a submission was accepted for
-- Run this in Supabase SQL Editor

-- Add accepted_event_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'form_submissions' AND column_name = 'accepted_event_id'
  ) THEN
    ALTER TABLE form_submissions 
    ADD COLUMN accepted_event_id TEXT;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_accepted_event_id 
  ON form_submissions(accepted_event_id) 
  WHERE accepted_event_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN form_submissions.accepted_event_id IS 'Event ID for which the submission was accepted. Used to filter accepted submissions by event in dispatch view.';
