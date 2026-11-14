-- Adds events.submission_payment_form_id (used by EditEvent / NewEvent when a submission payment form is selected).
--
-- If saves fail with:
--   "Could not find the 'submission_payment_form_id' column of 'events' in the schema cache"
-- run this entire script in the Supabase SQL editor for your project, then retry saving the event.
-- PostgREST usually picks up the new column within a short time; if not, wait a minute or use Dashboard support docs for refreshing schema cache.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS submission_payment_form_id uuid REFERENCES public.registration_forms (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.events.submission_payment_form_id IS
  'registration_forms.id — form participants fill at the payment pipeline step (workflow B or D)';
