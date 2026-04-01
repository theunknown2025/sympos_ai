-- ============================================
-- Academy Courses: Add published_at for publish status tracking
-- ============================================
-- Run in Supabase SQL Editor. Ensures publish status is fully supported.
-- The academy_courses table already has status ('draft', 'published', 'archived').
-- This script adds published_at to record when a course was published.

-- Add published_at column if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'academy_courses'
      AND column_name = 'published_at'
  ) THEN
    ALTER TABLE academy_courses
    ADD COLUMN published_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create index for filtering by publish status
CREATE INDEX IF NOT EXISTS idx_academy_courses_published_at
  ON academy_courses(published_at)
  WHERE published_at IS NOT NULL;

-- Trigger to set published_at when status changes to 'published'
CREATE OR REPLACE FUNCTION academy_courses_set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    NEW.published_at = NOW();
  ELSIF NEW.status != 'published' THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_academy_courses_set_published_at ON academy_courses;
CREATE TRIGGER trigger_academy_courses_set_published_at
  BEFORE UPDATE ON academy_courses
  FOR EACH ROW
  EXECUTE PROCEDURE academy_courses_set_published_at();
