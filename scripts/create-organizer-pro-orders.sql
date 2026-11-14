-- Organizer Pro checkout orders (offers + proof of payment)
CREATE TABLE IF NOT EXISTS organizer_pro_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_code TEXT NOT NULL CHECK (offer_code IN ('single_event', 'single_event_editions', 'multi_events')),
  full_name TEXT NOT NULL,
  account_email TEXT NOT NULL,
  events_count INTEGER NOT NULL DEFAULT 1 CHECK (events_count >= 1),
  editions_count INTEGER NOT NULL DEFAULT 0 CHECK (editions_count >= 0),
  price_per_event_mad NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_per_edition_mad NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_ht_mad NUMERIC(12,2) NOT NULL DEFAULT 0,
  tva_rate NUMERIC(5,4) NOT NULL DEFAULT 0.20,
  amount_ttc_mad NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MAD',
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'cancelled')),
  proof_file_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  proof_file_names JSONB NOT NULL DEFAULT '[]'::jsonb,
  organizer_notes TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizer_pro_orders_user ON organizer_pro_orders(organizer_user_id);
CREATE INDEX IF NOT EXISTS idx_organizer_pro_orders_status ON organizer_pro_orders(status);

ALTER TABLE organizer_pro_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizer can view own pro orders" ON organizer_pro_orders;
CREATE POLICY "Organizer can view own pro orders"
  ON organizer_pro_orders FOR SELECT
  USING (
    organizer_user_id = auth.uid()
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') IN ('SuperAdmin', 'SubSuperAdmin')
  );

DROP POLICY IF EXISTS "Organizer can insert own pro orders" ON organizer_pro_orders;
CREATE POLICY "Organizer can insert own pro orders"
  ON organizer_pro_orders FOR INSERT
  WITH CHECK (
    organizer_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Organizer can update own pending pro orders" ON organizer_pro_orders;
CREATE POLICY "Organizer can update own pending pro orders"
  ON organizer_pro_orders FOR UPDATE
  USING (
    organizer_user_id = auth.uid()
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') IN ('SuperAdmin', 'SubSuperAdmin')
  )
  WITH CHECK (
    organizer_user_id = auth.uid()
    OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') IN ('SuperAdmin', 'SubSuperAdmin')
  );

DROP POLICY IF EXISTS "SuperAdmin can delete pro orders" ON organizer_pro_orders;
CREATE POLICY "SuperAdmin can delete pro orders"
  ON organizer_pro_orders FOR DELETE
  USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() ->> 'role') IN ('SuperAdmin', 'SubSuperAdmin')
  );

DROP TRIGGER IF EXISTS update_organizer_pro_orders_updated_at ON organizer_pro_orders;
CREATE TRIGGER update_organizer_pro_orders_updated_at
  BEFORE UPDATE ON organizer_pro_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

