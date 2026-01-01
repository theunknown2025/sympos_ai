-- ============================================
-- PROGRAMS TABLE
-- ============================================
-- This table stores program schedules created in the Program Builder
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  config TEXT NOT NULL, -- JSON string: ProgramBuilderConfig
  venues TEXT NOT NULL, -- JSON string: Venue[]
  cards TEXT NOT NULL, -- JSON string: ProgramCard[]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_programs_user_id ON programs(user_id);

-- Index for faster queries by updated_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_programs_updated_at ON programs(updated_at DESC);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PROGRAMS
-- ============================================
-- Users can only view their own programs
CREATE POLICY "Users can view own programs"
  ON programs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own programs
CREATE POLICY "Users can insert own programs"
  ON programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own programs
CREATE POLICY "Users can update own programs"
  ON programs FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own programs
CREATE POLICY "Users can delete own programs"
  ON programs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- UPDATE TRIGGER (for updated_at)
-- ============================================
-- Create the function if it doesn't exist (from other tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for programs table
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

