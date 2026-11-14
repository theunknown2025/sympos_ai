-- Committee invitations: email delivery, invitee snapshot, attachments
-- Run in Supabase SQL Editor (project via MCP or dashboard).

-- Allow jury profiles before the invitee signs up
ALTER TABLE public.jury_members
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.jury_members
  DROP CONSTRAINT IF EXISTS unique_jury_member_user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_jury_members_user_id_unique
  ON public.jury_members (user_id)
  WHERE user_id IS NOT NULL;

-- Invitation extensions
ALTER TABLE public.committee_invitations
  ADD COLUMN IF NOT EXISTS invitation_type TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS committee_member_id UUID REFERENCES public.committee_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email_subject TEXT,
  ADD COLUMN IF NOT EXISTS email_content TEXT,
  ADD COLUMN IF NOT EXISTS attached_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS invitee_snapshot JSONB;

ALTER TABLE public.committee_invitations
  DROP CONSTRAINT IF EXISTS committee_invitations_invitation_type_check;

ALTER TABLE public.committee_invitations
  ADD CONSTRAINT committee_invitations_invitation_type_check CHECK (
    invitation_type = ANY (ARRAY['standard'::text, 'email'::text])
  );

CREATE INDEX IF NOT EXISTS idx_committee_invitations_invited_by
  ON public.committee_invitations (invited_by);

CREATE INDEX IF NOT EXISTS idx_committee_invitations_invitation_type
  ON public.committee_invitations (invitation_type);

CREATE INDEX IF NOT EXISTS idx_committee_invitations_committee_member_id
  ON public.committee_invitations (committee_member_id);

COMMENT ON COLUMN public.committee_invitations.invitation_type IS
  'standard = platform invite from member record; email = custom subject/body with attachments';
COMMENT ON COLUMN public.committee_invitations.invitee_snapshot IS
  'Copy of invitee profile fields when no committee_members row exists yet';
