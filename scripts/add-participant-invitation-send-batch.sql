-- Group participant invitations sent in the same Account Manager send action
ALTER TABLE public.committee_invitations
  ADD COLUMN IF NOT EXISTS send_batch_id UUID;

CREATE INDEX IF NOT EXISTS idx_committee_invitations_send_batch_id
  ON public.committee_invitations (send_batch_id)
  WHERE send_batch_id IS NOT NULL;

COMMENT ON COLUMN public.committee_invitations.send_batch_id IS
  'Shared id for invitations sent together (participant Account Manager bulk send)';
