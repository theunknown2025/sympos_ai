-- Registration workflow (A/B) and payment offer FKs on events.
-- Applied via Supabase MCP migration: add_registration_and_submission_payment_offers_to_events
-- Re-run locally if needed (idempotent column adds).

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS registration_workflow_preset TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS registration_payment_offer_id UUID REFERENCES public.payments(id) ON DELETE SET NULL;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS submission_payment_offer_id UUID REFERENCES public.payments(id) ON DELETE SET NULL;

COMMENT ON COLUMN events.registration_workflow_preset IS 'A: registration only; B: registration + payment';
COMMENT ON COLUMN events.registration_payment_offer_id IS 'payments.id when registration includes payment (preset B)';
COMMENT ON COLUMN events.submission_payment_offer_id IS 'payments.id when submission workflow includes payment (presets B or D)';
