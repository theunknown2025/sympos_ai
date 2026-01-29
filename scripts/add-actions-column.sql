-- ============================================
-- Add 'actions' column to registration_forms table
-- ============================================
-- This script adds the missing 'actions' column to store form email actions
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Add the actions column if it doesn't exist
DO $$ 
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'registration_forms' 
    AND column_name = 'actions'
  ) THEN
    -- Add the actions column
    ALTER TABLE registration_forms 
    ADD COLUMN actions TEXT; -- JSON string to store email actions
    
    -- Add a comment to document the column
    COMMENT ON COLUMN registration_forms.actions IS 'JSON string storing email actions like sendCopyOfAnswers and sendConfirmationEmail';
    
    RAISE NOTICE 'Column "actions" added to registration_forms table';
  ELSE
    RAISE NOTICE 'Column "actions" already exists in registration_forms table';
  END IF;
END $$;

-- ============================================
-- Verify the column was added
-- ============================================
-- Run this query to verify:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'registration_forms'
-- AND column_name = 'actions';
