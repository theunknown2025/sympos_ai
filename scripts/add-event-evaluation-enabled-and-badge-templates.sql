-- evaluation_enabled + badge_template_ids on events.
-- Applied on Supabase via MCP: add_event_evaluation_enabled_and_badge_templates

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS evaluation_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS badge_template_ids TEXT DEFAULT '[]';

COMMENT ON COLUMN events.evaluation_enabled IS 'When true, event uses evaluation forms and scientific committees';
COMMENT ON COLUMN events.badge_template_ids IS 'JSON array of certificate template UUIDs for participant badges';
