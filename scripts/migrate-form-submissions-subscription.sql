-- Migration script to add subscription type, entity name, and role to form_submissions table
-- Run this in Supabase SQL Editor if you have an existing form_submissions table

-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add subscription_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'form_submissions' AND column_name = 'subscription_type'
  ) THEN
    ALTER TABLE form_submissions 
    ADD COLUMN subscription_type TEXT NOT NULL DEFAULT 'self' 
    CHECK (subscription_type IN ('self', 'entity'));
  END IF;

  -- Add entity_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'form_submissions' AND column_name = 'entity_name'
  ) THEN
    ALTER TABLE form_submissions 
    ADD COLUMN entity_name TEXT;
  END IF;

  -- Add role column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'form_submissions' AND column_name = 'role'
  ) THEN
    ALTER TABLE form_submissions 
    ADD COLUMN role TEXT NOT NULL DEFAULT 'Participant' 
    CHECK (role IN ('Organizer', 'Participant'));
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_subscription_type ON form_submissions(subscription_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_role ON form_submissions(role);
CREATE INDEX IF NOT EXISTS idx_form_submissions_entity_name ON form_submissions(entity_name) WHERE entity_name IS NOT NULL;

