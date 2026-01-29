-- ============================================
-- Add Public Read Policy for Organizer Profiles
-- ============================================
-- This allows authenticated users to view organizer profiles
-- This is needed for participants to see organizer information on event previews
-- Run this in Supabase SQL Editor

-- Policy: Authenticated users can view organizer profiles
-- This allows participants to see organizer information when viewing events
CREATE POLICY "Authenticated users can view organizer profiles"
ON organizer_profiles FOR SELECT
TO authenticated
USING (true);
