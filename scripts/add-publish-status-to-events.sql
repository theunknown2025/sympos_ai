-- Migration: Add publish_status column to events table
-- This migration adds a publish_status column to track event publication status
-- Values: 'Draft', 'Published', 'Closed'

-- Step 1: Add publish_status column with default value 'Draft'
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS publish_status TEXT DEFAULT 'Draft';

-- Step 2: Add constraint to ensure only valid values
ALTER TABLE events
  ADD CONSTRAINT check_publish_status 
  CHECK (publish_status IN ('Draft', 'Published', 'Closed'));

-- Step 3: Update existing events to have 'Draft' status if NULL
UPDATE events
SET publish_status = 'Draft'
WHERE publish_status IS NULL;

-- Step 4: Make the column NOT NULL after setting defaults
ALTER TABLE events
  ALTER COLUMN publish_status SET NOT NULL;

-- Step 5: Add comment to document the column
COMMENT ON COLUMN events.publish_status IS 'Publication status of the event: Draft (not visible to participants), Published (visible to participants), Closed (event is closed)';

-- Migration complete!
