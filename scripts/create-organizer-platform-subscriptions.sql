-- ============================================================
-- Organizer platform subscription (Free 15-day trial / Pro)
-- ============================================================

CREATE TABLE IF NOT EXISTS organizer_platform_subscriptions (
  organizer_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL DEFAULT 'none'
    CHECK (plan_code IN ('none', 'free', 'pro')),
  status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (status IN ('unpaid', 'trial', 'active', 'expired', 'pending_payment', 'suspended')),
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizer_platform_subscriptions_status
  ON organizer_platform_subscriptions(status);

ALTER TABLE organizer_platform_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizer can view own platform subscription" ON organizer_platform_subscriptions;
CREATE POLICY "Organizer can view own platform subscription"
  ON organizer_platform_subscriptions FOR SELECT
  USING (
    organizer_user_id = auth.uid()
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "Organizer can insert own platform subscription" ON organizer_platform_subscriptions;
CREATE POLICY "Organizer can insert own platform subscription"
  ON organizer_platform_subscriptions FOR INSERT
  WITH CHECK (
    organizer_user_id = auth.uid()
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "Organizer can update own platform subscription" ON organizer_platform_subscriptions;
CREATE POLICY "Organizer can update own platform subscription"
  ON organizer_platform_subscriptions FOR UPDATE
  USING (
    organizer_user_id = auth.uid()
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  )
  WITH CHECK (
    organizer_user_id = auth.uid()
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "SuperAdmin can delete platform subscriptions" ON organizer_platform_subscriptions;
CREATE POLICY "SuperAdmin can delete platform subscriptions"
  ON organizer_platform_subscriptions FOR DELETE
  USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

DROP TRIGGER IF EXISTS update_organizer_platform_subscriptions_updated_at ON organizer_platform_subscriptions;
CREATE TRIGGER update_organizer_platform_subscriptions_updated_at
  BEFORE UPDATE ON organizer_platform_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
