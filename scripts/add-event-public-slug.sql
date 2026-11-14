-- Public share links for published events (/e/:slug).
-- Run in Supabase SQL Editor once.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS public_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_public_slug
  ON events(public_slug)
  WHERE public_slug IS NOT NULL;

DROP POLICY IF EXISTS "Events: public view by slug" ON events;
CREATE POLICY "Events: public view by slug"
  ON events FOR SELECT
  TO anon, authenticated
  USING (
    publish_status = 'Published'
    AND public_slug IS NOT NULL
  );

COMMENT ON COLUMN events.public_slug IS 'URL slug for public page at /e/{slug}';

-- Landing page & browse: allow anonymous read of all Published events
DROP POLICY IF EXISTS "Events: public listing published" ON events;
CREATE POLICY "Events: public listing published"
  ON events FOR SELECT
  TO anon, authenticated
  USING (publish_status = 'Published');

-- Optional backfill for existing Published rows: run scripts/backfill-event-public-slugs.sql
