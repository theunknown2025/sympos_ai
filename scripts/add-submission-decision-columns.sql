-- Migration script to add decision fields to form_submissions table
-- Run this in Supabase SQL Editor

-- Add decision columns if they don't exist
DO $$ 
BEGIN
  -- Add decision_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'form_submissions' AND column_name = 'decision_status'
  ) THEN
    ALTER TABLE form_submissions 
    ADD COLUMN decision_status TEXT 
    CHECK (decision_status IN ('accepted', 'reserved', 'rejected', NULL));
  END IF;

  -- Add decision_comment column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'form_submissions' AND column_name = 'decision_comment'
  ) THEN
    ALTER TABLE form_submissions 
    ADD COLUMN decision_comment TEXT;
  END IF;

  -- Add decision_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'form_submissions' AND column_name = 'decision_date'
  ) THEN
    ALTER TABLE form_submissions 
    ADD COLUMN decision_date TIMESTAMPTZ;
  END IF;

  -- Add decided_by column (user who made the decision)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'form_submissions' AND column_name = 'decided_by'
  ) THEN
    ALTER TABLE form_submissions 
    ADD COLUMN decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_decision_status ON form_submissions(decision_status) WHERE decision_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_form_submissions_decision_date ON form_submissions(decision_date) WHERE decision_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_form_submissions_decided_by ON form_submissions(decided_by) WHERE decided_by IS NOT NULL;

-- Add comment
COMMENT ON COLUMN form_submissions.decision_status IS 'Decision status: accepted, reserved, or rejected';
COMMENT ON COLUMN form_submissions.decision_comment IS 'Comments or notes about the decision';
COMMENT ON COLUMN form_submissions.decision_date IS 'Date and time when the decision was made';
COMMENT ON COLUMN form_submissions.decided_by IS 'User ID of the person who made the decision';

