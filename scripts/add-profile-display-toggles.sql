-- ============================================
-- Add Display Toggle Columns to organizer_profiles table
-- ============================================
-- This migration adds toggle fields to control visibility of committees and events in public profile
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Add display toggle columns
ALTER TABLE organizer_profiles 
ADD COLUMN IF NOT EXISTS show_committees BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS show_events BOOLEAN DEFAULT FALSE;

-- Add column comments
COMMENT ON COLUMN organizer_profiles.show_committees IS 'Whether to display committees section in public profile';
COMMENT ON COLUMN organizer_profiles.show_events IS 'Whether to display events section in public profile';

-- ============================================
-- Verify the migration
-- ============================================
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'organizer_profiles' 
-- AND column_name IN ('show_committees', 'show_events')
-- ORDER BY ordinal_position;
