-- Allow participant account invitations (Account Manager → Send)
-- Run in Supabase SQL Editor after add-committee-invitation-email-fields.sql

ALTER TABLE public.committee_invitations
  DROP CONSTRAINT IF EXISTS committee_invitations_invitation_type_check;

ALTER TABLE public.committee_invitations
  ADD CONSTRAINT committee_invitations_invitation_type_check CHECK (
    invitation_type = ANY (ARRAY['standard'::text, 'email'::text, 'participant'::text])
  );

COMMENT ON COLUMN public.committee_invitations.invitation_type IS
  'standard = platform invite; email = committee email invite; participant = organizer Account Manager participant invite';

-- Do not add participant invitees to organizer committee_members roster on accept
CREATE OR REPLACE FUNCTION public.sync_committee_member_for_invitation_id(p_invitation_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv committee_invitations%ROWTYPE;
  v_jury jury_members%ROWTYPE;
  v_member_id UUID;
  v_snapshot JSONB;
  v_cm_id TEXT;
  v_first TEXT;
  v_last TEXT;
  v_email TEXT;
  v_affiliation TEXT;
  v_research_domains TEXT;
  v_links TEXT;
  v_preferred_languages TEXT;
BEGIN
  SELECT * INTO v_inv
  FROM committee_invitations
  WHERE id = p_invitation_id;

  IF NOT FOUND OR v_inv.status <> 'accepted' THEN
    RETURN NULL;
  END IF;

  IF v_inv.invitation_type = 'participant' THEN
    RETURN NULL;
  END IF;

  IF v_inv.committee_member_id IS NOT NULL THEN
    RETURN v_inv.committee_member_id;
  END IF;

  v_email := LOWER(TRIM(v_inv.jury_member_email));
  IF v_email = '' THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_member_id
  FROM committee_members
  WHERE user_id = v_inv.invited_by
    AND LOWER(email) = v_email
  LIMIT 1;

  IF v_member_id IS NOT NULL THEN
    UPDATE committee_invitations
    SET committee_member_id = v_member_id
    WHERE id = v_inv.id;
    RETURN v_member_id;
  END IF;

  SELECT * INTO v_jury FROM jury_members WHERE id = v_inv.jury_member_id;
  v_snapshot := COALESCE(v_inv.invitee_snapshot, '{}'::jsonb);

  IF v_jury.first_name IS NOT NULL
     AND TRIM(v_jury.first_name) <> ''
     AND TRIM(v_jury.first_name) <> 'Invited' THEN
    v_first := TRIM(v_jury.first_name);
  ELSIF v_snapshot ? 'firstName' AND TRIM(v_snapshot->>'firstName') <> '' THEN
    v_first := TRIM(v_snapshot->>'firstName');
  ELSE
    v_first := 'Invited';
  END IF;

  IF v_jury.last_name IS NOT NULL
     AND TRIM(v_jury.last_name) <> ''
     AND TRIM(v_jury.last_name) <> 'Member' THEN
    v_last := TRIM(v_jury.last_name);
  ELSIF v_snapshot ? 'lastName' AND TRIM(v_snapshot->>'lastName') <> '' THEN
    v_last := TRIM(v_snapshot->>'lastName');
  ELSE
    v_last := 'Member';
  END IF;

  v_cm_id := NULLIF(TRIM(v_snapshot->>'committeeMemberId'), '');
  IF v_cm_id IS NULL THEN
    v_cm_id := 'CM-INV-' || UPPER(SUBSTRING(REPLACE(v_inv.id::text, '-', '') FROM 1 FOR 8));
  END IF;

  v_affiliation := COALESCE(
    NULLIF(v_jury.affiliation, ''),
    CASE WHEN v_snapshot ? 'affiliation' THEN (v_snapshot->'affiliation')::text ELSE NULL END,
    '{}'
  );
  v_research_domains := COALESCE(
    NULLIF(v_jury.research_domains, ''),
    CASE WHEN v_snapshot ? 'researchDomains' THEN (v_snapshot->'researchDomains')::text ELSE NULL END,
    '[]'
  );
  v_links := COALESCE(
    NULLIF(v_jury.links, ''),
    CASE WHEN v_snapshot ? 'identifiers' THEN (v_snapshot->'identifiers')::text ELSE NULL END,
    '{}'
  );

  IF v_jury.preferred_language IS NOT NULL AND TRIM(v_jury.preferred_language) <> '' THEN
    v_preferred_languages := to_jsonb(ARRAY[v_jury.preferred_language])::text;
  ELSIF v_snapshot ? 'preferredLanguage' AND TRIM(v_snapshot->>'preferredLanguage') <> '' THEN
    v_preferred_languages := to_jsonb(ARRAY[v_snapshot->>'preferredLanguage'])::text;
  ELSE
    v_preferred_languages := '[]';
  END IF;

  BEGIN
    INSERT INTO committee_members (
      user_id,
      committee_member_id,
      email,
      first_name,
      last_name,
      title,
      gender,
      nationality,
      phone,
      address,
      country,
      position,
      affiliation,
      preferred_languages,
      research_domains,
      links
    ) VALUES (
      v_inv.invited_by,
      v_cm_id,
      v_email,
      v_first,
      v_last,
      COALESCE(NULLIF(v_jury.title, ''), NULLIF(v_snapshot->>'title', '')),
      COALESCE(NULLIF(v_jury.gender, ''), NULLIF(v_snapshot->>'gender', '')),
      COALESCE(NULLIF(v_jury.nationality, ''), NULLIF(v_snapshot->>'nationality', '')),
      COALESCE(NULLIF(v_jury.phone, ''), NULLIF(v_snapshot->>'phone', '')),
      COALESCE(NULLIF(v_jury.address, ''), NULLIF(v_snapshot->>'address', '')),
      COALESCE(NULLIF(v_snapshot->>'country', ''), NULLIF(v_snapshot->'affiliation'->>'country', '')),
      COALESCE(NULLIF(v_snapshot->>'position', ''), NULLIF(v_snapshot->'affiliation'->>'position', '')),
      v_affiliation,
      v_preferred_languages,
      v_research_domains,
      v_links
    )
    RETURNING id INTO v_member_id;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT id INTO v_member_id
      FROM committee_members
      WHERE user_id = v_inv.invited_by
        AND LOWER(email) = v_email
      LIMIT 1;
  END;

  IF v_member_id IS NOT NULL THEN
    UPDATE committee_invitations
    SET committee_member_id = v_member_id
    WHERE id = v_inv.id;
  END IF;

  RETURN v_member_id;
END;
$$;
