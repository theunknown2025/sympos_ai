# Answers Tables Implementation

## Overview

Two new dedicated tables have been created to better handle form answers:
1. **`registration_forms_answers`** - Stores answers from registration forms
2. **`submissions_answers`** - Stores answers from submission forms

This separation allows for:
- Better querying and filtering of answers
- Improved indexing and performance
- Easier data analysis and reporting
- Better handling of individual field answers

## Tables Structure

### `registration_forms_answers`
Stores individual field answers from registration forms (forms with "Reg" prefix).

**Columns:**
- `id` (UUID) - Primary key
- `submission_id` (UUID) - References `form_submissions.id`
- `form_id` (UUID) - References `registration_forms.id`
- `field_id` (TEXT) - The form field ID
- `field_label` (TEXT) - The human-readable field label
- `answer_value` (TEXT) - The answer value (can be JSON for complex types)
- `answer_type` (TEXT) - Type: 'text', 'number', 'date', 'file', 'array', 'object', 'boolean'
- `is_general_info` (BOOLEAN) - True if this is a general info field (name, email, etc.)
- `created_at` (TIMESTAMPTZ) - When the answer was created

### `submissions_answers`
Stores individual field answers from submission forms (forms with "Sub" prefix).

**Same structure as `registration_forms_answers`**

## Setup Instructions

### Step 1: Create the Tables
Run the SQL script in Supabase SQL Editor:
```sql
-- Run: scripts/create-answers-tables.sql
```

This will:
- Create both tables
- Add indexes for performance
- Set up Row Level Security (RLS) policies
- Create helper functions

### Step 2: Migrate Existing Data (Optional)
If you have existing submissions, migrate them:
```sql
-- Run: scripts/migrate-existing-answers.sql
```

This will:
- Extract answers from `form_submissions.answers` (JSON)
- Insert them into the appropriate table based on form type
- Update field labels from form definitions

### Step 3: Verify Setup
Check that tables were created:
```sql
SELECT COUNT(*) FROM registration_forms_answers;
SELECT COUNT(*) FROM submissions_answers;
```

## Usage

### Automatic Saving
When a form is submitted, answers are automatically saved to:
- `form_submissions` table (as JSON, for backward compatibility)
- The appropriate answers table (`registration_forms_answers` or `submissions_answers`)

### Service Functions

#### Save Answers
```typescript
import { saveRegistrationFormAnswers, saveSubmissionAnswers } from './services/formAnswersService';

// Answers are automatically saved when using saveFormSubmission()
// But you can also save directly:
await saveRegistrationFormAnswers(submissionId, formId, form, answers);
await saveSubmissionAnswers(submissionId, formId, form, answers);
```

#### Retrieve Answers
```typescript
import { 
  getRegistrationFormAnswers, 
  getSubmissionAnswers,
  answersArrayToObject 
} from './services/formAnswersService';

// Get answers as array
const answers = await getRegistrationFormAnswers(submissionId);

// Convert back to object format
const answersObject = answersArrayToObject(answers);
```

## Benefits

1. **Better Querying**: Query specific fields across all submissions
   ```sql
   SELECT * FROM submissions_answers 
   WHERE field_label = 'Paper Title' 
   AND answer_value LIKE '%machine learning%';
   ```

2. **Improved Performance**: Indexed fields allow faster searches

3. **Data Analysis**: Easier to analyze answers by field
   ```sql
   SELECT field_label, COUNT(*) as count
   FROM submissions_answers
   GROUP BY field_label;
   ```

4. **Type Safety**: Answer types are explicitly stored

5. **Field Labels**: Human-readable labels stored with answers

## Backward Compatibility

- The `form_submissions.answers` JSON column is still maintained
- Existing code continues to work
- New submissions save to both places
- You can gradually migrate to using the new tables

## Migration Notes

- Existing answers in `form_submissions.answers` are preserved
- Migration script extracts and moves them to new tables
- Field labels are updated from form definitions when available
- Migration is idempotent (safe to run multiple times)

## Example Queries

### Get all answers for a submission
```sql
SELECT field_label, answer_value, answer_type
FROM submissions_answers
WHERE submission_id = 'submission-uuid'
ORDER BY created_at;
```

### Find submissions with specific answer
```sql
SELECT DISTINCT submission_id
FROM submissions_answers
WHERE field_label = 'Keywords'
AND answer_value ILIKE '%AI%';
```

### Count answers by field
```sql
SELECT field_label, COUNT(*) as answer_count
FROM registration_forms_answers
GROUP BY field_label
ORDER BY answer_count DESC;
```

## RLS Policies

Both tables have Row Level Security enabled:
- Users can only view/insert/update/delete answers for their own form submissions
- Policies check ownership through `form_submissions.user_id`

## Next Steps

1. Run the table creation script
2. (Optional) Run the migration script for existing data
3. Start using the new service functions
4. Gradually migrate queries to use the new tables

