-- Official program linked to an event (participant submission timeline — final "Program" step).
-- Run in Supabase SQL Editor after programs.event_id exists.

ALTER TABLE events
ADD COLUMN IF NOT EXISTS published_program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_published_program_id ON events(published_program_id);

COMMENT ON COLUMN events.published_program_id IS 'Saved program (programs.id) published to participants for schedule / contribution visibility';
