-- Fix: payment-step submissions use submission_pipeline_kind = 'payment'.
-- Error: new row violates check constraint "form_submissions_submission_pipeline_kind_check"
--
-- Older DBs only allowed ('abstract','article'). This script:
-- 1) Drops every CHECK on public.form_submissions that mentions submission_pipeline_kind (names vary).
-- 2) Normalizes existing values so re-adding the constraint succeeds.
-- 3) Adds one constraint allowing abstract | article | payment.
--
-- Run in Supabase SQL Editor (Dashboard → SQL). Safe to re-run.

-- 1) Drop all matching CHECK constraints (not only form_submissions_submission_pipeline_kind_check)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'form_submissions'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%submission_pipeline_kind%'
  LOOP
    EXECUTE format('ALTER TABLE public.form_submissions DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- 2) Clean values so the new CHECK can be applied (empty string, stray spaces, wrong case)
UPDATE public.form_submissions
SET submission_pipeline_kind = NULL
WHERE submission_pipeline_kind IS NOT NULL
  AND trim(submission_pipeline_kind) = '';

UPDATE public.form_submissions
SET submission_pipeline_kind = lower(trim(submission_pipeline_kind))
WHERE submission_pipeline_kind IS NOT NULL;

UPDATE public.form_submissions
SET submission_pipeline_kind = NULL
WHERE submission_pipeline_kind IS NOT NULL
  AND submission_pipeline_kind NOT IN ('abstract', 'article', 'payment');

-- 3) Single canonical constraint
ALTER TABLE public.form_submissions
  ADD CONSTRAINT form_submissions_submission_pipeline_kind_check
  CHECK (
    submission_pipeline_kind IS NULL
    OR submission_pipeline_kind IN ('abstract', 'article', 'payment')
  );

COMMENT ON COLUMN public.form_submissions.submission_pipeline_kind IS
  'abstract | article | payment — payment rows link to article via parent_submission_id.';
