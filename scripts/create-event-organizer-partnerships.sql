-- ============================================
-- Event organizer partnerships (co-organizers)
-- Partners get the same view/update access as the event owner.
-- Run in Supabase SQL Editor or via migration tooling.
-- ============================================

CREATE TABLE IF NOT EXISTS event_organizer_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  partner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, partner_user_id),
  CHECK (partner_user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_event_organizer_partnerships_event_id
  ON event_organizer_partnerships(event_id);

CREATE INDEX IF NOT EXISTS idx_event_organizer_partnerships_partner_user_id
  ON event_organizer_partnerships(partner_user_id);

ALTER TABLE event_organizer_partnerships ENABLE ROW LEVEL SECURITY;

-- Helper used by events RLS policies
CREATE OR REPLACE FUNCTION public.is_event_organizer_partner(p_event_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM event_organizer_partnerships eop
    WHERE eop.event_id = p_event_id
      AND eop.partner_user_id = p_user_id
  );
$$;

-- Partnership rows: event owner or existing partner can view; only owner can manage
DROP POLICY IF EXISTS "Event partnerships: owner and partners can view" ON event_organizer_partnerships;
CREATE POLICY "Event partnerships: owner and partners can view"
  ON event_organizer_partnerships FOR SELECT
  USING (
    partner_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_organizer_partnerships.event_id
        AND e.user_id = auth.uid()
    )
    OR is_event_organizer_partner(event_organizer_partnerships.event_id, auth.uid())
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "Event partnerships: owner can insert" ON event_organizer_partnerships;
CREATE POLICY "Event partnerships: owner can insert"
  ON event_organizer_partnerships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_organizer_partnerships.event_id
        AND e.user_id = auth.uid()
    )
    OR is_event_organizer_partner(event_organizer_partnerships.event_id, auth.uid())
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

DROP POLICY IF EXISTS "Event partnerships: owner can delete" ON event_organizer_partnerships;
CREATE POLICY "Event partnerships: owner can delete"
  ON event_organizer_partnerships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_organizer_partnerships.event_id
        AND e.user_id = auth.uid()
    )
    OR is_event_organizer_partner(event_organizer_partnerships.event_id, auth.uid())
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );

-- Extend events policies for partner organizers
DROP POLICY IF EXISTS "Events: organizer, participant(active), and campus admins can view" ON events;
CREATE POLICY "Events: organizer, participant(active), and campus admins can view"
  ON events FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_event_organizer_partner(id, auth.uid())
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

DROP POLICY IF EXISTS "Events: organizer owners and campus admins can update" ON events;
CREATE POLICY "Events: organizer owners and campus admins can update"
  ON events FOR UPDATE
  USING (
    auth.uid() = user_id
    OR is_event_organizer_partner(id, auth.uid())
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
    OR is_event_organizer_partner(id, auth.uid())
    OR EXISTS (
      SELECT 1
      FROM sub_super_admin_memberships sm
      WHERE sm.user_id = auth.uid()
        AND sm.campus_id = events.campus_id
    )
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') = 'SuperAdmin'
  );
