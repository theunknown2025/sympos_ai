-- ============================================
-- Migration: Add new fields to organizer_profiles table
-- ============================================
-- This migration adds the new fields required for the Profile Folder feature
-- Run this in Supabase SQL Editor if the table already exists

-- Add new entity information fields
ALTER TABLE organizer_profiles 
ADD COLUMN IF NOT EXISTS entity_creation_date DATE,
ADD COLUMN IF NOT EXISTS entity_legal_status TEXT,
ADD COLUMN IF NOT EXISTS entity_country TEXT,
ADD COLUMN IF NOT EXISTS entity_city TEXT,
ADD COLUMN IF NOT EXISTS entity_official_website TEXT,
ADD COLUMN IF NOT EXISTS entity_mission TEXT,
ADD COLUMN IF NOT EXISTS entity_vision TEXT,
ADD COLUMN IF NOT EXISTS entity_scientific_domains TEXT DEFAULT '[]'; -- JSON array of scientific domains

-- Add representative photo field
ALTER TABLE organizer_profiles 
ADD COLUMN IF NOT EXISTS representative_photo TEXT;

-- ============================================
-- Verify the migration
-- ============================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'organizer_profiles' 
-- ORDER BY ordinal_position;
