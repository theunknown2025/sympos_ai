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
  entity_name TEXT, -- Nom officiel de l'université / institution
  entity_creation_date DATE, -- Date de création
  entity_legal_status TEXT, -- Statut juridique (publique / privée / fondation / consortium académique)
  entity_country TEXT, -- Pays
  entity_city TEXT, -- Ville
  entity_official_website TEXT, -- Site web officiel
  entity_email TEXT, -- Email institutionnel
  entity_phone TEXT, -- Téléphone
  entity_address TEXT,
  entity_websites TEXT DEFAULT '[]', -- JSON array of website URLs
  entity_links TEXT DEFAULT '[]', -- JSON array of link objects {id, name, url}
  entity_mission TEXT, -- Mission statement
  entity_vision TEXT, -- Vision statement
  entity_scientific_domains TEXT DEFAULT '[]', -- JSON array of scientific domains
  
  -- Representative Information
  representative_photo TEXT, -- Photo
  representative_full_name TEXT, -- Full Name
  representative_email TEXT, -- Email
  representative_phone TEXT, -- Phone number
  representative_function TEXT, -- Function
  representative_address TEXT,
  
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
