-- Backfill public_slug for Published events missing a slug (run after add-event-public-slug.sql).
-- Resolves duplicates manually if the base slug already exists.

DO $$
DECLARE
  r RECORD;
  base_slug TEXT;
  candidate TEXT;
  suffix INT;
BEGIN
  FOR r IN
    SELECT id, name
    FROM events
    WHERE publish_status = 'Published'
      AND public_slug IS NULL
      AND name IS NOT NULL
  LOOP
    base_slug := trim(both '-' from regexp_replace(lower(r.name), '[^a-z0-9]+', '-', 'g'));
    IF base_slug = '' OR length(base_slug) > 48 THEN
      base_slug := 'event';
    END IF;
    base_slug := left(base_slug, 48);
    candidate := base_slug;
    suffix := 0;

    WHILE EXISTS (SELECT 1 FROM events e WHERE e.public_slug = candidate AND e.id <> r.id) LOOP
      suffix := suffix + 1;
      candidate := base_slug || '-' || suffix::text;
    END LOOP;

    UPDATE events SET public_slug = candidate, updated_at = NOW() WHERE id = r.id;
  END LOOP;
END $$;
