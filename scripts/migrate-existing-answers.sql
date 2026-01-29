-- ============================================
-- Migration Script: Move existing answers to new tables
-- ============================================
-- This script migrates existing answers from form_submissions.answers (JSON)
-- to the new registration_forms_answers and submissions_answers tables
-- Run this AFTER creating the new tables with create-answers-tables.sql

-- ============================================
-- 1. MIGRATE REGISTRATION FORMS ANSWERS
-- ============================================
-- This migrates answers from registration forms (forms with "Reg" prefix)
INSERT INTO registration_forms_answers (
  submission_id,
  form_id,
  field_id,
  field_label,
  answer_value,
  answer_type,
  is_general_info,
  created_at
)
SELECT 
  fs.id as submission_id,
  fs.form_id,
  key as field_id,
  key as field_label, -- Will be updated later if form is available
  CASE 
    WHEN value::text IS NULL THEN NULL
    WHEN jsonb_typeof(value) = 'array' THEN value::text
    WHEN jsonb_typeof(value) = 'object' THEN value::text
    ELSE value::text
  END as answer_value,
  CASE 
    WHEN value IS NULL THEN 'text'
    WHEN jsonb_typeof(value) = 'array' THEN 'array'
    WHEN jsonb_typeof(value) = 'object' THEN 'object'
    WHEN jsonb_typeof(value) = 'number' THEN 'number'
    WHEN jsonb_typeof(value) = 'boolean' THEN 'boolean'
    WHEN value::text ~ '^\d{4}-\d{2}-\d{2}' THEN 'date'
    WHEN value::text LIKE 'http%://%' OR value::text LIKE 'https%://%' THEN 'file'
    ELSE 'text'
  END as answer_type,
  CASE WHEN key LIKE 'general_%' THEN true ELSE false END as is_general_info,
  fs.created_at
FROM form_submissions fs
CROSS JOIN LATERAL jsonb_each(
  CASE 
    WHEN fs.answers IS NULL THEN '{}'::jsonb
    WHEN typeof(fs.answers) = 'text' THEN fs.answers::jsonb
    ELSE fs.answers::jsonb
  END
) AS answer_data(key, value)
INNER JOIN registration_forms rf ON rf.id = fs.form_id
WHERE 
  -- Only migrate registration forms (forms with "Reg" prefix or containing "registration")
  (LOWER(rf.title) LIKE 'reg - %' OR LOWER(rf.title) LIKE 'reg-%' 
   OR LOWER(rf.title) LIKE '%registration%' OR LOWER(rf.title) LIKE '%register%')
  AND NOT (
    LOWER(rf.title) LIKE 'sub - %' OR LOWER(rf.title) LIKE 'sub-%'
    OR LOWER(rf.title) LIKE '%submission%' OR LOWER(rf.title) LIKE '%submit%'
  )
  AND fs.answers IS NOT NULL
  AND fs.answers != 'null'::text
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. MIGRATE SUBMISSIONS ANSWERS
-- ============================================
-- This migrates answers from submission forms (forms with "Sub" prefix)
INSERT INTO submissions_answers (
  submission_id,
  form_id,
  field_id,
  field_label,
  answer_value,
  answer_type,
  is_general_info,
  created_at
)
SELECT 
  fs.id as submission_id,
  fs.form_id,
  key as field_id,
  key as field_label, -- Will be updated later if form is available
  CASE 
    WHEN value::text IS NULL THEN NULL
    WHEN jsonb_typeof(value) = 'array' THEN value::text
    WHEN jsonb_typeof(value) = 'object' THEN value::text
    ELSE value::text
  END as answer_value,
  CASE 
    WHEN value IS NULL THEN 'text'
    WHEN jsonb_typeof(value) = 'array' THEN 'array'
    WHEN jsonb_typeof(value) = 'object' THEN 'object'
    WHEN jsonb_typeof(value) = 'number' THEN 'number'
    WHEN jsonb_typeof(value) = 'boolean' THEN 'boolean'
    WHEN value::text ~ '^\d{4}-\d{2}-\d{2}' THEN 'date'
    WHEN value::text LIKE 'http%://%' OR value::text LIKE 'https%://%' THEN 'file'
    ELSE 'text'
  END as answer_type,
  CASE WHEN key LIKE 'general_%' THEN true ELSE false END as is_general_info,
  fs.created_at
FROM form_submissions fs
CROSS JOIN LATERAL jsonb_each(
  CASE 
    WHEN fs.answers IS NULL THEN '{}'::jsonb
    WHEN typeof(fs.answers) = 'text' THEN fs.answers::jsonb
    ELSE fs.answers::jsonb
  END
) AS answer_data(key, value)
INNER JOIN registration_forms rf ON rf.id = fs.form_id
WHERE 
  -- Only migrate submission forms (forms with "Sub" prefix or containing "submission")
  (LOWER(rf.title) LIKE 'sub - %' OR LOWER(rf.title) LIKE 'sub-%'
   OR LOWER(rf.title) LIKE '%submission%' OR LOWER(rf.title) LIKE '%submit%')
  AND fs.answers IS NOT NULL
  AND fs.answers != 'null'::text
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. UPDATE FIELD LABELS FROM FORMS
-- ============================================
-- This updates field labels in registration_forms_answers using form data
UPDATE registration_forms_answers rfa
SET field_label = COALESCE(
  -- Try to get label from form sections/fields
  (
    SELECT f.label
    FROM registration_forms rf
    CROSS JOIN LATERAL jsonb_array_elements(
      COALESCE(
        CASE WHEN typeof(rf.sections) = 'text' THEN rf.sections::jsonb ELSE rf.sections::jsonb END,
        '[]'::jsonb
      )
    ) AS section
    CROSS JOIN LATERAL jsonb_array_elements(
      COALESCE(section.value->'fields', '[]'::jsonb)
    ) AS field
    CROSS JOIN LATERAL jsonb_to_record(field.value) AS f(id text, label text)
    WHERE rf.id = rfa.form_id AND f.id = rfa.field_id
    LIMIT 1
  ),
  rfa.field_id -- Fallback to field_id if not found
)
WHERE field_label = field_id; -- Only update if label hasn't been set yet

-- Similar update for submissions_answers
UPDATE submissions_answers sa
SET field_label = COALESCE(
  (
    SELECT f.label
    FROM registration_forms rf
    CROSS JOIN LATERAL jsonb_array_elements(
      COALESCE(
        CASE WHEN typeof(rf.sections) = 'text' THEN rf.sections::jsonb ELSE rf.sections::jsonb END,
        '[]'::jsonb
      )
    ) AS section
    CROSS JOIN LATERAL jsonb_array_elements(
      COALESCE(section.value->'fields', '[]'::jsonb)
    ) AS field
    CROSS JOIN LATERAL jsonb_to_record(field.value) AS f(id text, label text)
    WHERE rf.id = sa.form_id AND f.id = sa.field_id
    LIMIT 1
  ),
  sa.field_id
)
WHERE field_label = field_id;

-- ============================================
-- 4. VERIFY MIGRATION
-- ============================================
-- Run these queries to verify the migration:
-- 
-- SELECT COUNT(*) as total_submissions FROM form_submissions;
-- SELECT COUNT(*) as registration_answers FROM registration_forms_answers;
-- SELECT COUNT(*) as submission_answers FROM submissions_answers;
-- 
-- SELECT 
--   fs.id,
--   rf.title as form_title,
--   COUNT(rfa.id) as answer_count
-- FROM form_submissions fs
-- LEFT JOIN registration_forms rf ON rf.id = fs.form_id
-- LEFT JOIN registration_forms_answers rfa ON rfa.submission_id = fs.id
-- GROUP BY fs.id, rf.title
-- ORDER BY answer_count DESC;

