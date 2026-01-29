-- Jury Member Tables Setup Script
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- ============================================
-- 1. JURY MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS jury_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  gender TEXT,
  nationality TEXT,
  phone TEXT,
  address TEXT,
  preferred_language TEXT,
  affiliation TEXT, -- JSON string
  research_domains TEXT, -- JSON string
  links TEXT, -- JSON string (identifiers)
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_jury_member_user_id UNIQUE (user_id),
  CONSTRAINT unique_jury_member_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_jury_members_user_id ON jury_members(user_id);
CREATE INDEX IF NOT EXISTS idx_jury_members_email ON jury_members(email);

-- ============================================
-- 2. COMMITTEE INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS committee_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  committee_name TEXT NOT NULL,
  field_of_intervention_id TEXT,
  field_of_intervention_name TEXT,
  jury_member_id UUID NOT NULL REFERENCES jury_members(id) ON DELETE CASCADE,
  jury_member_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  commentary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_committee_invitations_jury_member_id ON committee_invitations(jury_member_id);
CREATE INDEX IF NOT EXISTS idx_committee_invitations_committee_id ON committee_invitations(committee_id);
CREATE INDEX IF NOT EXISTS idx_committee_invitations_status ON committee_invitations(status);

-- ============================================
-- 3. EVENT ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  jury_member_id UUID NOT NULL REFERENCES jury_members(id) ON DELETE CASCADE,
  jury_member_email TEXT NOT NULL,
  attendance_confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_event_jury_attendance UNIQUE (event_id, jury_member_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendance_jury_member_id ON event_attendance(jury_member_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_confirmed ON event_attendance(attendance_confirmed);

