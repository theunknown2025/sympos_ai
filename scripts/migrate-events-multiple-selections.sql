-- Migration: Update events table to support multiple selections
-- This migration converts single selections to arrays for:
-- - Landing Page (landing_page_id -> landing_page_ids)
-- - Registration Form (registration_form_id -> registration_form_ids)
-- - Submission Form (submission_form_id -> submission_form_ids)
-- Certifications already support multiple (certificate_template_ids)

-- IMPORTANT: This migration keeps the old columns for backward compatibility.
-- After verifying the new columns work correctly, you can run the cleanup section at the bottom.

-- Step 1: Add new columns for arrays (as TEXT to store JSON arrays)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS landing_page_ids TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS registration_form_ids TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS submission_form_ids TEXT DEFAULT '[]';

-- Step 2: Migrate existing data from single columns to arrays
-- Convert single landing_page_id to array
UPDATE events
SET landing_page_ids = CASE
  WHEN landing_page_id IS NOT NULL THEN 
    json_build_array(landing_page_id)::text
  ELSE '[]'
END
WHERE landing_page_ids = '[]' OR landing_page_ids IS NULL;

-- Convert single registration_form_id to array
UPDATE events
SET registration_form_ids = CASE
  WHEN registration_form_id IS NOT NULL THEN 
    json_build_array(registration_form_id)::text
  ELSE '[]'
END
WHERE registration_form_ids = '[]' OR registration_form_ids IS NULL;

-- Convert single submission_form_id to array
UPDATE events
SET submission_form_ids = CASE
  WHEN submission_form_id IS NOT NULL THEN 
    json_build_array(submission_form_id)::text
  ELSE '[]'
END
WHERE submission_form_ids = '[]' OR submission_form_ids IS NULL;

-- Step 3: Make new columns NOT NULL after migration
ALTER TABLE events
  ALTER COLUMN landing_page_ids SET NOT NULL,
  ALTER COLUMN registration_form_ids SET NOT NULL,
  ALTER COLUMN submission_form_ids SET NOT NULL;

-- Step 3b: Make old columns nullable to avoid constraint issues during transition
-- This allows the application to work with both old and new columns
ALTER TABLE events
  ALTER COLUMN landing_page_id DROP NOT NULL,
  ALTER COLUMN registration_form_id DROP NOT NULL,
  ALTER COLUMN submission_form_id DROP NOT NULL;

-- Step 4: Add comments to document the change
COMMENT ON COLUMN events.landing_page_ids IS 'JSON array of landing page UUIDs. Example: ["uuid1", "uuid2"]';
COMMENT ON COLUMN events.registration_form_ids IS 'JSON array of registration form UUIDs. Example: ["uuid1", "uuid2"]';
COMMENT ON COLUMN events.submission_form_ids IS 'JSON array of submission form UUIDs. Example: ["uuid1", "uuid2"]';

-- ============================================
-- OPTIONAL CLEANUP (Run after verifying everything works)
-- ============================================
-- Uncomment the following section after you've updated your application code
-- and verified that the new array columns are working correctly:

-- Step 5: Drop old single columns (only after verifying new columns work)
-- ALTER TABLE events DROP COLUMN IF EXISTS landing_page_id;
-- ALTER TABLE events DROP COLUMN IF EXISTS registration_form_id;
-- ALTER TABLE events DROP COLUMN IF EXISTS submission_form_id;

-- Step 6: Drop old indexes that reference the single columns
-- DROP INDEX IF EXISTS idx_events_landing_page_id;

-- ============================================
-- Migration complete!
-- ============================================
-- Next steps:
-- 1. Update the Event interface in types.ts:
--    - landingPageId: string -> landingPageIds: string[]
--    - registrationFormId?: string -> registrationFormIds: string[]
--    - submissionFormId?: string -> submissionFormIds: string[]
--
-- 2. Update eventService.ts to:
--    - Serialize arrays to JSON strings when saving
--    - Deserialize JSON strings to arrays when reading
--
-- 3. Update NewEvent.tsx component to:
--    - Support multiple selection for landing pages
--    - Support multiple selection for registration forms
--    - Support multiple selection for submission forms

