# Table Consolidation Analysis: evaluation_answers vs participant_reviews

## Current Situation

### `evaluation_answers` Table
**Structure:**
- `id` (UUID)
- `evaluation_form_id` (UUID)
- `user_id` (UUID)
- `submitted_by` (TEXT)
- `general_info` (TEXT - JSON)
- `answers` (TEXT - JSON)
- `created_at`, `updated_at`

**Missing Critical Fields:**
- ❌ `submission_id` - Cannot link to specific submissions
- ❌ `event_id` - Cannot link to events
- ❌ `participant_id` - Cannot link to committee members
- ❌ `status` - Cannot track draft/completed status

**Current Usage:**
- Only 1 record in database
- Used as fallback in SubmissionsEvaluation to find reviews
- Saved from ReviewForm but lacks proper linking

### `participant_reviews` Table
**Structure:**
- `id` (UUID)
- `participant_id` (UUID) - Links to committee_members
- `user_id` (UUID) - Links to auth users
- `event_id` (UUID) - Links to events
- `form_id` (UUID) - Links to evaluation forms
- `submission_id` (UUID) - **Links to submissions**
- `submission_type` (TEXT) - 'submission' or 'evaluation'
- `status` (TEXT) - 'draft' or 'completed'
- `answers` (TEXT - JSON)
- `created_at`, `updated_at`

**Has All Required Fields:**
- ✅ Complete linking to submissions
- ✅ Complete linking to events
- ✅ Complete linking to participants
- ✅ Status tracking

## Problem

1. **Duplicate Data Storage**: Same review data is saved to both tables
2. **Missing Links**: `evaluation_answers` cannot properly link to submissions
3. **Complex Matching Logic**: SubmissionsEvaluation tries to match `evaluation_answers` to submissions by `user_id`, which is error-prone
4. **Data Inconsistency**: Two sources of truth for the same data

## Solution

**Remove `evaluation_answers` usage for reviews and use only `participant_reviews`**

### Why `participant_reviews` is Better:
1. Has `submission_id` - Direct link to submissions
2. Has `event_id` - Direct link to events
3. Has `participant_id` - Direct link to committee members
4. Has `status` - Can track draft/completed
5. Has `submission_type` - Can distinguish submission vs evaluation reviews

### Migration Plan:
1. Remove code that saves to `evaluation_answers` in ReviewForm
2. Remove code that queries `evaluation_answers` in SubmissionsEvaluation
3. Keep `participant_reviews` as the single source of truth
4. Optionally: Keep `evaluation_answers` table for future standalone evaluations (not linked to submissions), but don't use it for reviews

## Files to Modify:
1. `components/Participant/reviews/ReviewForm.tsx` - Remove saveEvaluationAnswer call
2. `components/Admin/Submissions/ManageSubmission/SubmissionsEvaluation.tsx` - Remove evaluation_answers query logic
3. `services/evaluationAnswerService.ts` - Keep for potential future use, but not for reviews
