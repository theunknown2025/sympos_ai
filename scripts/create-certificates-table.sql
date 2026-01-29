-- Create certificates table for storing generated certificates
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL,
  template_id UUID NOT NULL,
  participant_submission_id UUID NOT NULL,
  certificate_image_url TEXT NOT NULL,
  certificate_url TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_event_id ON certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_template_id ON certificates(template_id);
CREATE INDEX IF NOT EXISTS idx_certificates_participant_submission_id ON certificates(participant_submission_id);

-- Enable RLS (Row Level Security)
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read certificates (for public viewing)
CREATE POLICY "Certificates are publicly readable"
  ON certificates
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert certificates
CREATE POLICY "Users can insert their own certificates"
  ON certificates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own certificates
CREATE POLICY "Users can update their own certificates"
  ON certificates
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own certificates
CREATE POLICY "Users can delete their own certificates"
  ON certificates
  FOR DELETE
  USING (auth.uid() = user_id);
