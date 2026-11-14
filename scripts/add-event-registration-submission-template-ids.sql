-- Split event badge/certificate templates by registration vs submission context.
-- Applied on Supabase via MCP: add_event_registration_submission_template_ids

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS registration_badge_template_ids TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS registration_certificate_template_ids TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS submission_badge_template_ids TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS submission_certificate_template_ids TEXT DEFAULT '[]';

COMMENT ON COLUMN events.registration_badge_template_ids IS 'JSON array of badge template UUIDs for registration/check-in';
COMMENT ON COLUMN events.registration_certificate_template_ids IS 'JSON array of certificate template UUIDs for registration attendees';
COMMENT ON COLUMN events.submission_badge_template_ids IS 'JSON array of badge template UUIDs for accepted submissions';
COMMENT ON COLUMN events.submission_certificate_template_ids IS 'JSON array of certificate template UUIDs for accepted submissions';

UPDATE events
SET submission_badge_template_ids = badge_template_ids
WHERE badge_template_ids IS NOT NULL
  AND badge_template_ids != '[]'
  AND (submission_badge_template_ids IS NULL OR submission_badge_template_ids = '[]');

UPDATE events
SET registration_certificate_template_ids = certificate_template_ids
WHERE certificate_template_ids IS NOT NULL
  AND certificate_template_ids != '[]'
  AND (registration_certificate_template_ids IS NULL OR registration_certificate_template_ids = '[]');
