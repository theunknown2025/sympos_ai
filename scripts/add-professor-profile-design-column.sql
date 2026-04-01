-- ============================================
-- Add Design Column to professor_profiles table
-- ============================================
-- This migration adds design customization functionality to professor profiles
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Add design column (JSONB for flexible design settings)
ALTER TABLE professor_profiles 
ADD COLUMN IF NOT EXISTS design JSONB;

-- Add column comment
COMMENT ON COLUMN professor_profiles.design IS 'JSON object containing design customization settings (colors, backgrounds, banners, section-specific styles)';

-- ============================================
-- Verify the migration
-- ============================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'professor_profiles' 
-- AND column_name = 'design'
-- ORDER BY ordinal_position;
