-- ============================================================
-- Campus + Membership schema for Sub-Super Admin subscriptions
-- MVP: subscription_status = 'active' | 'blocked'
-- ============================================================

-- ------------------------------
-- 1) CAMPUS
-- ------------------------------
CREATE TABLE IF NOT EXISTS campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campuses_name ON campuses(name);
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;

-- Root or members can view campuses
CREATE POLICY "Members can view campuses"
  ON campuses FOR SELECT
  USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
    OR EXISTS (
      SELECT 1
      FROM organizer_memberships om
      WHERE om.campus_id = campuses.id
        AND om.organizer_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM participant_memberships pm
      WHERE pm.campus_id = campuses.id
        AND pm.participant_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM sub_super_admin_memberships sm
      WHERE sm.campus_id = campuses.id
        AND sm.user_id = auth.uid()
    )
  );

-- Keep updated_at in sync (function is created in setup-supabase-tables.sql)
CREATE TRIGGER update_campuses_updated_at
  BEFORE UPDATE ON campuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------
-- 2) ORGANIZER MEMBERSHIPS (1 organizer -> 1 campus)
-- ------------------------------
CREATE TABLE IF NOT EXISTS organizer_memberships (
  organizer_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizer_memberships_campus_id ON organizer_memberships(campus_id);
ALTER TABLE organizer_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizer can view own membership"
  ON organizer_memberships FOR SELECT
  USING (organizer_user_id = auth.uid());

-- Only root or sub-super-admins can change subscription status
CREATE POLICY "Super admins can manage organizer membership"
  ON organizer_memberships FOR ALL
  USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
    OR EXISTS (
      SELECT 1
      FROM sub_super_admin_memberships sm
      WHERE sm.user_id = auth.uid()
        AND sm.campus_id = organizer_memberships.campus_id
    )
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
    OR EXISTS (
      SELECT 1
      FROM sub_super_admin_memberships sm
      WHERE sm.user_id = auth.uid()
        AND sm.campus_id = organizer_memberships.campus_id
    )
  );

CREATE TRIGGER update_organizer_memberships_updated_at
  BEFORE UPDATE ON organizer_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------
-- 3) PARTICIPANT MEMBERSHIPS (participant can be in multiple campuses)
-- ------------------------------
CREATE TABLE IF NOT EXISTS participant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (participant_user_id, campus_id)
);

CREATE INDEX IF NOT EXISTS idx_participant_memberships_participant ON participant_memberships(participant_user_id);
CREATE INDEX IF NOT EXISTS idx_participant_memberships_campus ON participant_memberships(campus_id);
ALTER TABLE participant_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participant can view own memberships"
  ON participant_memberships FOR SELECT
  USING (participant_user_id = auth.uid());

CREATE POLICY "Super admins can manage participant membership"
  ON participant_memberships FOR ALL
  USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
    OR EXISTS (
      SELECT 1
      FROM sub_super_admin_memberships sm
      WHERE sm.user_id = auth.uid()
        AND sm.campus_id = participant_memberships.campus_id
    )
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
    OR EXISTS (
      SELECT 1
      FROM sub_super_admin_memberships sm
      WHERE sm.user_id = auth.uid()
        AND sm.campus_id = participant_memberships.campus_id
    )
  );

CREATE TRIGGER update_participant_memberships_updated_at
  BEFORE UPDATE ON participant_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------
-- 4) SUB-SUPER ADMIN MEMBERSHIPS (user -> campus they manage)
-- ------------------------------
CREATE TABLE IF NOT EXISTS sub_super_admin_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, campus_id)
);

CREATE INDEX IF NOT EXISTS idx_sub_super_admin_memberships_user_id ON sub_super_admin_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_super_admin_memberships_campus_id ON sub_super_admin_memberships(campus_id);
ALTER TABLE sub_super_admin_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sub-super admins can view their memberships"
  ON sub_super_admin_memberships FOR SELECT
  USING (
    user_id = auth.uid()
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

CREATE POLICY "Root super admin can manage sub-super admin memberships"
  ON sub_super_admin_memberships FOR ALL
  USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

CREATE TRIGGER update_sub_super_admin_memberships_updated_at
  BEFORE UPDATE ON sub_super_admin_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5) ADD campus_id TO events + update events RLS policies
-- ============================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_campus_id ON events(campus_id);

-- Ensure publish_status exists (some deployments may run migrations out of order)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS publish_status TEXT DEFAULT 'Draft';

-- Drop old event policies created by setup-supabase-tables.sql
DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

-- Re-create event policies with campus-aware access:
-- - Organizer owners always can access their own events
-- - Participants can see Published/Closed events for campuses where they are active
--   - Backward compatible: if no participant_memberships row exists for that campus, allow (treat as active)
-- - Sub-super-admins can access events in their managed campus
-- - Root Super Admin can access everything

CREATE POLICY "Events: organizer, participant(active), and campus admins can view"
  ON events FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM sub_super_admin_memberships sm
      WHERE sm.user_id = auth.uid()
        AND sm.campus_id = events.campus_id
    )
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
    OR (
      publish_status IN ('Published', 'Closed')
      AND (
        EXISTS (
          SELECT 1
          FROM participant_memberships pm
          WHERE pm.participant_user_id = auth.uid()
            AND pm.campus_id = events.campus_id
            AND pm.subscription_status = 'active'
        )
        OR NOT EXISTS (
          SELECT 1
          FROM participant_memberships pm2
          WHERE pm2.participant_user_id = auth.uid()
            AND pm2.campus_id = events.campus_id
        )
      )
    )
  );

CREATE POLICY "Events: organizers can insert own events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Events: organizer owners and campus admins can update"
  ON events FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM sub_super_admin_memberships sm
      WHERE sm.user_id = auth.uid()
        AND sm.campus_id = events.campus_id
    )
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM sub_super_admin_memberships sm
      WHERE sm.user_id = auth.uid()
        AND sm.campus_id = events.campus_id
    )
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

CREATE POLICY "Events: organizer owners and root can delete"
  ON events FOR DELETE
  USING (
    auth.uid() = user_id
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

-- Optional: trigger to keep updated_at in sync for campus_id updates
-- (events trigger already exists in setup-supabase-tables.sql)

