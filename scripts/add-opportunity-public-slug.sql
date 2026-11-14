-- Public share links for published opportunities (/o/:slug).
-- Run in Supabase SQL Editor once.

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS public_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_opportunities_public_slug
  ON opportunities(public_slug)
  WHERE public_slug IS NOT NULL;

DROP POLICY IF EXISTS "Opportunities: public view by slug" ON opportunities;
CREATE POLICY "Opportunities: public view by slug"
  ON opportunities FOR SELECT
  TO anon, authenticated
  USING (
    publish_status = 'Published'
    AND public_slug IS NOT NULL
  );

COMMENT ON COLUMN opportunities.public_slug IS 'URL slug for public page at /o/{slug}';
