-- Migration: Remove committee-related fields from committee_invitations table
-- This migration removes committee_id, committee_name, field_of_intervention_id, and field_of_intervention_name
-- as invitations are now for general membership, not specific committees

-- Step 1: Drop the foreign key constraint on committee_id
ALTER TABLE public.committee_invitations 
DROP CONSTRAINT IF EXISTS committee_invitations_committee_id_fkey;

-- Step 2: Drop the index on committee_id
DROP INDEX IF EXISTS idx_committee_invitations_committee_id;

-- Step 3: Remove committee-related columns
ALTER TABLE public.committee_invitations 
DROP COLUMN IF EXISTS committee_id,
DROP COLUMN IF EXISTS committee_name,
DROP COLUMN IF EXISTS field_of_intervention_id,
DROP COLUMN IF EXISTS field_of_intervention_name;

-- Step 4: Update the status check constraint to include 'not_invited' status
ALTER TABLE public.committee_invitations 
DROP CONSTRAINT IF EXISTS committee_invitations_status_check;

ALTER TABLE public.committee_invitations 
ADD CONSTRAINT committee_invitations_status_check CHECK (
  status = ANY (
    ARRAY[
      'not_invited'::text,
      'pending'::text,
      'accepted'::text,
      'rejected'::text
    ]
  )
);

-- Step 5: Add a comment to document the change
COMMENT ON TABLE public.committee_invitations IS 'Stores invitations for jury members to join the platform. Committee-specific fields have been removed as invitations are now for general membership.';

