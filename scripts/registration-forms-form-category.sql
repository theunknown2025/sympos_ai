-- registration_forms: explicit category for registration vs submission vs payment forms.
-- Run on Supabase (SQL editor) or via Supabase MCP apply_migration.

ALTER TABLE registration_forms
  ADD COLUMN IF NOT EXISTS form_category text NOT NULL DEFAULT 'registration';

UPDATE registration_forms
SET form_category = 'submission'
WHERE lower(title) ~ '^sub[[:space:]]*-';

UPDATE registration_forms
SET form_category = 'payment'
WHERE lower(title) ~ '^pay[[:space:]]*-';

DO $$
BEGIN
  ALTER TABLE registration_forms
    ADD CONSTRAINT registration_forms_form_category_check
    CHECK (form_category IN ('registration', 'submission', 'payment'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN registration_forms.form_category IS 'registration | submission | payment — payment forms are selectable as event submission payment form.';
