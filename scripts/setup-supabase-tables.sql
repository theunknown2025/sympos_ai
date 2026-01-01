-- Supabase Database Setup Script
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- ============================================
-- 1. LANDING PAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  config TEXT NOT NULL, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landing_pages_user_id ON landing_pages(user_id);

-- ============================================
-- 2. CERTIFICATE TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  background_image TEXT,
  background_image_type TEXT,
  width INTEGER,
  height INTEGER,
  elements TEXT, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificate_templates_user_id ON certificate_templates(user_id);

-- ============================================
-- 3. COMMITTEE MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  committee_member_id TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  gender TEXT,
  nationality TEXT,
  phone TEXT,
  address TEXT,
  country TEXT,
  position TEXT,
  affiliation TEXT, -- JSON string
  preferred_languages TEXT, -- JSON string
  research_domains TEXT, -- JSON string
  links TEXT, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_email UNIQUE (email),
  CONSTRAINT unique_committee_member_id UNIQUE (committee_member_id)
);

CREATE INDEX IF NOT EXISTS idx_committee_members_user_id ON committee_members(user_id);

-- ============================================
-- 4. REGISTRATION FORMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS registration_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sections TEXT, -- JSON string
  fields TEXT, -- JSON string
  general_info TEXT, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_forms_user_id ON registration_forms(user_id);

-- ============================================
-- 5. FORM SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  event_title TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_by TEXT,
  general_info TEXT, -- JSON string
  answers TEXT, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_user_id ON form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_event_id ON form_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES - LANDING PAGES
-- ============================================
CREATE POLICY "Users can view own landing_pages"
  ON landing_pages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own landing_pages"
  ON landing_pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own landing_pages"
  ON landing_pages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own landing_pages"
  ON landing_pages FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 8. RLS POLICIES - CERTIFICATE TEMPLATES
-- ============================================
CREATE POLICY "Users can view own certificate_templates"
  ON certificate_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certificate_templates"
  ON certificate_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own certificate_templates"
  ON certificate_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own certificate_templates"
  ON certificate_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 9. RLS POLICIES - COMMITTEE MEMBERS
-- ============================================
CREATE POLICY "Users can view own committee_members"
  ON committee_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own committee_members"
  ON committee_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own committee_members"
  ON committee_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own committee_members"
  ON committee_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 10. RLS POLICIES - REGISTRATION FORMS
-- ============================================
CREATE POLICY "Users can view own registration_forms"
  ON registration_forms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registration_forms"
  ON registration_forms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registration_forms"
  ON registration_forms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own registration_forms"
  ON registration_forms FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 11. RLS POLICIES - FORM SUBMISSIONS
-- ============================================
CREATE POLICY "Users can view own form_submissions"
  ON form_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own form_submissions"
  ON form_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own form_submissions"
  ON form_submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own form_submissions"
  ON form_submissions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 12. UPDATE TRIGGERS (for updated_at)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_committee_members_updated_at
  BEFORE UPDATE ON committee_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registration_forms_updated_at
  BEFORE UPDATE ON registration_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. PROGRAMS TABLE
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_programs_user_id ON programs(user_id);
CREATE INDEX IF NOT EXISTS idx_programs_updated_at ON programs(updated_at DESC);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own programs"
  ON programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own programs"
  ON programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own programs"
  ON programs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own programs"
  ON programs FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

