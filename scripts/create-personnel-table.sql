-- ============================================
-- PERSONNEL TABLE
-- ============================================
-- This table stores personnel information
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Reference to auth user if created
  full_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  role_description TEXT,
  image_url TEXT,
  login TEXT, -- Login username (can be email or custom)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_personnel_user_id ON personnel(user_id);
CREATE INDEX IF NOT EXISTS idx_personnel_auth_user_id ON personnel(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_personnel_email ON personnel(email);
CREATE INDEX IF NOT EXISTS idx_personnel_created_at ON personnel(created_at DESC);

-- Enable Row Level Security
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own personnel"
  ON personnel FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personnel"
  ON personnel FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personnel"
  ON personnel FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own personnel"
  ON personnel FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_personnel_updated_at
  BEFORE UPDATE ON personnel
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

