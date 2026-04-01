-- ============================================
-- Add Publish Columns to organizer_profiles table
-- ============================================
-- This migration adds publishing functionality to organizer profiles
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Add publish columns
ALTER TABLE organizer_profiles 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

-- Create index on public_slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizer_profiles_public_slug ON organizer_profiles(public_slug);

-- Create index on is_published for filtering
CREATE INDEX IF NOT EXISTS idx_organizer_profiles_is_published ON organizer_profiles(is_published);

-- Add column comments
COMMENT ON COLUMN organizer_profiles.is_published IS 'Indicates if the profile is published and publicly accessible';
COMMENT ON COLUMN organizer_profiles.public_slug IS 'Unique slug used in the public URL for accessing the published profile';

-- ============================================
-- RLS Policy for Public Access
-- ============================================
-- Allow public read access to published profiles
CREATE POLICY "Public can view published profiles"
ON organizer_profiles FOR SELECT
USING (is_published = true);

-- ============================================
-- Verify the migration
-- ============================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'organizer_profiles' 
-- AND column_name IN ('is_published', 'public_slug')
-- ORDER BY ordinal_position;
