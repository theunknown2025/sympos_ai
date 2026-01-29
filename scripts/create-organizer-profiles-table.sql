-- ============================================
-- Create Table: organizer_profiles
-- ============================================
-- This table stores organizer profile information including entity and representative details
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

CREATE TABLE IF NOT EXISTS organizer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Entity Information
  entity_logo TEXT,
  entity_banner TEXT,
  entity_name TEXT,
  entity_email TEXT,
  entity_phone TEXT,
  entity_address TEXT,
  entity_websites TEXT DEFAULT '[]', -- JSON array of website URLs
  entity_links TEXT DEFAULT '[]', -- JSON array of link objects {id, name, url}
  
  -- Representative Information
  representative_full_name TEXT,
  representative_email TEXT,
  representative_phone TEXT,
  representative_address TEXT,
  representative_function TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizer_profiles_user_id ON organizer_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE organizer_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON organizer_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON organizer_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON organizer_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON organizer_profiles FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
-- Note: Uses the update_updated_at_column() function that should already exist
-- If it doesn't exist, run the function creation from setup-supabase-tables.sql first
CREATE TRIGGER update_organizer_profiles_updated_at
BEFORE UPDATE ON organizer_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verify the table was created
-- ============================================
-- SELECT * FROM organizer_profiles LIMIT 1;
