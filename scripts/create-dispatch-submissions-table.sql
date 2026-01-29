-- ============================================
-- DISPATCH_SUBMISSIONS TABLE
-- ============================================
-- This table stores the dispatching of accepted submissions to committee members
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS dispatch_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
  dispatching TEXT NOT NULL DEFAULT '{}', -- JSON string: { submissionId: [committeeMemberId1, committeeMemberId2, ...] }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_submissions_user_id ON dispatch_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_submissions_event_id ON dispatch_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_submissions_form_id ON dispatch_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_submissions_created_at ON dispatch_submissions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE dispatch_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own dispatch_submissions"
  ON dispatch_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dispatch_submissions"
  ON dispatch_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dispatch_submissions"
  ON dispatch_submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dispatch_submissions"
  ON dispatch_submissions FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_dispatch_submissions_updated_at
  BEFORE UPDATE ON dispatch_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

