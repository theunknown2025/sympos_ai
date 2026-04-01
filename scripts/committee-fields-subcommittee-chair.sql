-- Sub-committee chair: stored inside committees.fields_of_intervention JSON (no new column).
-- Each element of the JSON array may include chairMemberId (UUID string or null).
-- Run in Supabase SQL Editor after deploying the app changes.

-- Backfill: add chairMemberId: null to each field object that does not have it yet.
UPDATE committees c
SET
  fields_of_intervention = COALESCE(
    (
      SELECT jsonb_agg(
        CASE
          WHEN elem ? 'chairMemberId' THEN elem
          ELSE elem || '{"chairMemberId": null}'::jsonb
        END
      )::text
      FROM jsonb_array_elements(c.fields_of_intervention::jsonb) AS elem
    ),
    c.fields_of_intervention
  ),
  updated_at = NOW()
WHERE
  jsonb_typeof(c.fields_of_intervention::jsonb) = 'array';

-- Optional: fix rows where JSON is invalid (skip by running the UPDATE only on success).
-- If any row fails, fix or exclude it manually.
