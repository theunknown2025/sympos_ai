-- Migration: Add participant_user_id column to form_submissions table
-- This column tracks the user ID of the participant who submitted the form
-- Run this in Supabase SQL Editor

-- Add participant_user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'form_submissions' AND column_name = 'participant_user_id'
  ) THEN
    ALTER TABLE form_submissions 
    ADD COLUMN participant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_participant_user_id 
  ON form_submissions(participant_user_id) 
  WHERE participant_user_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN form_submissions.participant_user_id IS 'User ID of the participant who submitted the form. This is different from user_id which is the form creator (organizer).';
