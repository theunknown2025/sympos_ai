-- Opportunities module: jobs, training, fund postings with multi-step applications.
-- Run in Supabase SQL Editor once.

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('job', 'training', 'fund')),
  title TEXT NOT NULL,
  main_criteria TEXT,
  attached_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  deadline TIMESTAMPTZ,
  place TEXT,
  location_type TEXT NOT NULL DEFAULT 'in_house'
    CHECK (location_type IN ('in_house', 'remote', 'hybrid')),
  complementary_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  payment_form_id UUID REFERENCES registration_forms(id) ON DELETE SET NULL,
  payment_step_id UUID,
  publish_status TEXT NOT NULL DEFAULT 'Draft'
    CHECK (publish_status IN ('Draft', 'Published', 'Closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_campus_id ON opportunities(campus_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_publish_status ON opportunities(publish_status);

CREATE TABLE IF NOT EXISTS opportunity_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  participant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step_index INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'rejected', 'completed')),
  rejected_at_step_index INT,
  decision_comment TEXT,
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (opportunity_id, participant_user_id)
);

CREATE INDEX IF NOT EXISTS idx_opportunity_applications_opportunity
  ON opportunity_applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_applications_participant
  ON opportunity_applications(participant_user_id);

CREATE TABLE IF NOT EXISTS participant_saved_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_participant_saved_opportunities_user
  ON participant_saved_opportunities(user_id);

ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL;

ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS opportunity_application_id UUID
    REFERENCES opportunity_applications(id) ON DELETE SET NULL;

ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS opportunity_step_index INT;

CREATE INDEX IF NOT EXISTS idx_form_submissions_opportunity_application
  ON form_submissions(opportunity_application_id)
  WHERE opportunity_application_id IS NOT NULL;

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS opportunities_updated_at ON opportunities;
CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_opportunities_updated_at();

DROP TRIGGER IF EXISTS opportunity_applications_updated_at ON opportunity_applications;
CREATE TRIGGER opportunity_applications_updated_at
  BEFORE UPDATE ON opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION update_opportunities_updated_at();

-- RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_saved_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Opportunities: view" ON opportunities;
CREATE POLICY "Opportunities: view"
  ON opportunities FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM sub_super_admin_memberships sm
      WHERE sm.user_id = auth.uid() AND sm.campus_id = opportunities.campus_id
    )
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
    OR (
      publish_status IN ('Published', 'Closed')
      AND (
        EXISTS (
          SELECT 1 FROM participant_memberships pm
          WHERE pm.participant_user_id = auth.uid()
            AND pm.campus_id = opportunities.campus_id
            AND pm.subscription_status = 'active'
        )
        OR NOT EXISTS (
          SELECT 1 FROM participant_memberships pm2
          WHERE pm2.participant_user_id = auth.uid()
            AND pm2.campus_id = opportunities.campus_id
        )
      )
    )
  );

DROP POLICY IF EXISTS "Opportunities: insert own" ON opportunities;
CREATE POLICY "Opportunities: insert own"
  ON opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Opportunities: update own" ON opportunities;
CREATE POLICY "Opportunities: update own"
  ON opportunities FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM sub_super_admin_memberships sm
      WHERE sm.user_id = auth.uid() AND sm.campus_id = opportunities.campus_id
    )
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "Opportunities: delete own" ON opportunities;
CREATE POLICY "Opportunities: delete own"
  ON opportunities FOR DELETE
  USING (
    auth.uid() = user_id
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "Opportunity applications: participant view own" ON opportunity_applications;
CREATE POLICY "Opportunity applications: participant view own"
  ON opportunity_applications FOR SELECT
  USING (
    auth.uid() = participant_user_id
    OR EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = opportunity_applications.opportunity_id
        AND o.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM opportunities o
      JOIN sub_super_admin_memberships sm ON sm.campus_id = o.campus_id
      WHERE o.id = opportunity_applications.opportunity_id
        AND sm.user_id = auth.uid()
    )
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "Opportunity applications: participant insert" ON opportunity_applications;
CREATE POLICY "Opportunity applications: participant insert"
  ON opportunity_applications FOR INSERT
  WITH CHECK (auth.uid() = participant_user_id);

DROP POLICY IF EXISTS "Opportunity applications: organizer update" ON opportunity_applications;
CREATE POLICY "Opportunity applications: organizer update"
  ON opportunity_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = opportunity_applications.opportunity_id
        AND o.user_id = auth.uid()
    )
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "Saved opportunities: own rows" ON participant_saved_opportunities;
CREATE POLICY "Saved opportunities: own rows"
  ON participant_saved_opportunities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE opportunities IS 'Organizer job/training/fund postings with configurable application steps.';
COMMENT ON TABLE opportunity_applications IS 'Participant application progress through opportunity steps.';
