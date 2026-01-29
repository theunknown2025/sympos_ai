-- ============================================
-- Create Tables: registration_forms_answers and submissions_answers
-- ============================================
-- These tables store individual field answers separately for better querying and handling
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- ============================================
-- 1. REGISTRATION FORMS ANSWERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS registration_forms_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL,
  field_label TEXT NOT NULL,
  answer_value TEXT, -- Can store string, number, or JSON for complex answers
  answer_type TEXT NOT NULL DEFAULT 'text' CHECK (answer_type IN ('text', 'number', 'date', 'file', 'array', 'object', 'boolean')),
  is_general_info BOOLEAN DEFAULT false, -- True if this is a general info field (name, email, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for registration_forms_answers
CREATE INDEX IF NOT EXISTS idx_registration_answers_submission_id ON registration_forms_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_registration_answers_form_id ON registration_forms_answers(form_id);
CREATE INDEX IF NOT EXISTS idx_registration_answers_field_id ON registration_forms_answers(field_id);
CREATE INDEX IF NOT EXISTS idx_registration_answers_field_label ON registration_forms_answers(field_label);
CREATE INDEX IF NOT EXISTS idx_registration_answers_created_at ON registration_forms_answers(created_at);

-- ============================================
-- 2. SUBMISSIONS ANSWERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS submissions_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL,
  field_label TEXT NOT NULL,
  answer_value TEXT, -- Can store string, number, or JSON for complex answers
  answer_type TEXT NOT NULL DEFAULT 'text' CHECK (answer_type IN ('text', 'number', 'date', 'file', 'array', 'object', 'boolean')),
  is_general_info BOOLEAN DEFAULT false, -- True if this is a general info field (name, email, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for submissions_answers
CREATE INDEX IF NOT EXISTS idx_submissions_answers_submission_id ON submissions_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_submissions_answers_form_id ON submissions_answers(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_answers_field_id ON submissions_answers(field_id);
CREATE INDEX IF NOT EXISTS idx_submissions_answers_field_label ON submissions_answers(field_label);
CREATE INDEX IF NOT EXISTS idx_submissions_answers_created_at ON submissions_answers(created_at);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE registration_forms_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions_answers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS POLICIES - REGISTRATION FORMS ANSWERS
-- ============================================
-- Policy: Users can view answers for their own form submissions
CREATE POLICY "Users can view own registration form answers"
  ON registration_forms_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM form_submissions fs
      WHERE fs.id = registration_forms_answers.submission_id
      AND fs.user_id = auth.uid()
    )
  );

-- Policy: Users can insert answers for their own form submissions
CREATE POLICY "Users can insert own registration form answers"
  ON registration_forms_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM form_submissions fs
      WHERE fs.id = registration_forms_answers.submission_id
      AND fs.user_id = auth.uid()
    )
  );

-- Policy: Users can update answers for their own form submissions
CREATE POLICY "Users can update own registration form answers"
  ON registration_forms_answers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM form_submissions fs
      WHERE fs.id = registration_forms_answers.submission_id
      AND fs.user_id = auth.uid()
    )
  );

-- Policy: Users can delete answers for their own form submissions
CREATE POLICY "Users can delete own registration form answers"
  ON registration_forms_answers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM form_submissions fs
      WHERE fs.id = registration_forms_answers.submission_id
      AND fs.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. RLS POLICIES - SUBMISSIONS ANSWERS
-- ============================================
-- Policy: Users can view answers for their own form submissions
CREATE POLICY "Users can view own submission answers"
  ON submissions_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM form_submissions fs
      WHERE fs.id = submissions_answers.submission_id
      AND fs.user_id = auth.uid()
    )
  );

-- Policy: Users can insert answers for their own form submissions
CREATE POLICY "Users can insert own submission answers"
  ON submissions_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM form_submissions fs
      WHERE fs.id = submissions_answers.submission_id
      AND fs.user_id = auth.uid()
    )
  );

-- Policy: Users can update answers for their own form submissions
CREATE POLICY "Users can update own submission answers"
  ON submissions_answers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM form_submissions fs
      WHERE fs.id = submissions_answers.submission_id
      AND fs.user_id = auth.uid()
    )
  );

-- Policy: Users can delete answers for their own form submissions
CREATE POLICY "Users can delete own submission answers"
  ON submissions_answers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM form_submissions fs
      WHERE fs.id = submissions_answers.submission_id
      AND fs.user_id = auth.uid()
    )
  );

-- ============================================
-- 6. VERIFY TABLES WERE CREATED
-- ============================================
-- Run these queries to verify:
-- SELECT * FROM registration_forms_answers LIMIT 10;
-- SELECT * FROM submissions_answers LIMIT 10;

-- ============================================
-- 7. HELPER FUNCTION: Get answer type from value
-- ============================================
CREATE OR REPLACE FUNCTION get_answer_type(answer_value TEXT)
RETURNS TEXT AS $$
BEGIN
  IF answer_value IS NULL THEN
    RETURN 'text';
  END IF;
  
  -- Check if it's a JSON array
  IF answer_value LIKE '[%' AND answer_value LIKE '%]' THEN
    RETURN 'array';
  END IF;
  
  -- Check if it's a JSON object
  IF answer_value LIKE '{%' AND answer_value LIKE '%}' THEN
    RETURN 'object';
  END IF;
  
  -- Check if it's a number
  IF answer_value ~ '^-?[0-9]+\.?[0-9]*$' THEN
    RETURN 'number';
  END IF;
  
  -- Check if it's a date (ISO format)
  IF answer_value ~ '^\d{4}-\d{2}-\d{2}' THEN
    RETURN 'date';
  END IF;
  
  -- Check if it's a file URL
  IF answer_value LIKE 'http%://%' OR answer_value LIKE 'https%://%' THEN
    RETURN 'file';
  END IF;
  
  -- Default to text
  RETURN 'text';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

