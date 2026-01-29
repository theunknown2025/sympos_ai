-- Migration: Add fields column to events table
-- This migration adds a fields column to store event fields (similar to keywords)
-- Fields are stored as a JSON array of strings

-- Step 1: Add fields column with default empty array
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS fields TEXT DEFAULT '[]';

-- Step 2: Update existing events to have empty array if NULL
UPDATE events
SET fields = '[]'
WHERE fields IS NULL;

-- Step 3: Add comment to document the column
COMMENT ON COLUMN events.fields IS 'Array of event fields stored as JSON array of strings (e.g., ["Computer Science", "Mathematics", "Physics"])';

-- Migration complete!
