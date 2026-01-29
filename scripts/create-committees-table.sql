-- ============================================
-- COMMITTEES TABLE
-- ============================================
-- This table stores review committees with their fields of intervention
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fields_of_intervention TEXT NOT NULL DEFAULT '[]', -- JSON string: FieldOfIntervention[]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_committees_user_id ON committees(user_id);
CREATE INDEX IF NOT EXISTS idx_committees_created_at ON committees(created_at DESC);

-- Enable Row Level Security
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own committees"
  ON committees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own committees"
  ON committees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own committees"
  ON committees FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own committees"
  ON committees FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_committees_updated_at
  BEFORE UPDATE ON committees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

