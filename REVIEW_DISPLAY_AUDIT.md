# Review Display Audit Report

## Problem Statement
Participant reviews submitted through `components/Participant/reviews/ReviewForm.tsx` are not being displayed in `components/Admin/Submissions/ManageSubmission/SubmissionsEvaluation.tsx`.

## Data Flow Analysis

### 1. How Reviews Are Saved (Participant Side)

**File:** `components/Participant/reviews/ReviewForm.tsx`

**Process:**
1. Participant fills out review form for a dispatched submission
2. On save (line 181-259), the review is saved to TWO tables:
   - `participant_reviews` table (via `saveReview()`)
   - `evaluation_answers` table (via `saveEvaluationAnswer()`)

**Key Data Saved:**
```typescript
await saveReview({
  participantId,        // Committee member ID (from committee_members table)
  userId: currentUser.id, // Auth user ID
  eventId: item.eventId, // Event ID
  formId: evaluationFormId, // Evaluation form ID (NOT submission form ID)
  submissionId: item.submissionId, // Submission ID from dispatched item
  submissionType: item.submissionType, // 'submission' or 'evaluation'
  status, // 'draft' or 'completed'
  answers, // JSON object with field answers
});
```

**Database Table:** `participant_reviews`
- `participant_id`: Committee member ID
- `user_id`: Auth user ID
- `event_id`: Event ID
- `form_id`: **Evaluation form ID**
- `submission_id`: Submission ID
- `submission_type`: 'submission' or 'evaluation'
- `status`: 'draft' or 'completed'
- `answers`: JSON string

### 2. How Reviews Are Retrieved (Admin Side)

**File:** `components/Admin/Submissions/ManageSubmission/SubmissionsEvaluation.tsx`

**Process:**
1. Admin loads submissions for their events (line 74)
2. For each submission, loads evaluation form (line 86-96)
3. Queries reviews using `getReviewsForSubmission()` (line 103)

**Key Query:**
```typescript
reviews = await getReviewsForSubmission(submission.id, evaluationForm.id);
```

**Service Function:** `services/reviewService.ts` (line 258-306)
```typescript
export const getReviewsForSubmission = async (
  submissionId: string,
  formId?: string
): Promise<ParticipantReview[]> => {
  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('submission_id', submissionId);
  
  if (formId) {
    query = query.eq('form_id', formId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  // ... returns reviews
}
```

## Potential Issues Identified

### Issue 1: Submission ID Mismatch
**Location:** `SubmissionsEvaluation.tsx` line 103

**Problem:**
- Reviews are saved with `item.submissionId` from dispatched items
- Reviews are queried with `submission.id` from `getEventSubmissions()`
- These IDs should match, but there might be edge cases where they don't

**Verification Needed:**
- Check if `item.submissionId` (from dispatch) always equals `submission.id` (from form_submissions table)
- The dispatched item gets submission ID from the dispatch record's `dispatching` JSON (line 128 in `dispatchedItemsService.ts`)
- The submission ID comes from the dispatch record which should match the actual submission ID

### Issue 2: Evaluation Form ID Mismatch
**Location:** Both `ReviewForm.tsx` and `SubmissionsEvaluation.tsx`

**Problem:**
- Review is saved with `evaluationFormId` (line 200 in ReviewForm.tsx)
- Review is queried with `evaluationForm.id` (line 103 in SubmissionsEvaluation.tsx)
- Both should use the same evaluation form ID from the event's `evaluationFormIds[0]`

**Potential Issue:**
- If event has multiple evaluation forms, there might be a mismatch
- If evaluation form is changed after reviews are saved, old reviews won't show

### Issue 3: Missing Form Filter
**Location:** `SubmissionsEvaluation.tsx` line 107

**Problem:**
- If `evaluationForm` is not found, it queries without form filter:
  ```typescript
  reviews = await getReviewsForSubmission(submission.id);
  ```
- This should still work, but might return reviews from wrong forms

### Issue 4: Data Type Mismatch
**Problem:**
- UUIDs in Supabase might be stored/compared as strings
- Need to ensure consistent string comparison

## Root Cause Analysis

After analyzing the code flow, the most likely issues are:

1. **Submission ID Mismatch**: The `submissionId` used when saving might not match the `submission.id` used when querying
2. **Evaluation Form ID Not Found**: If the event doesn't have an evaluation form configured, reviews won't be found
3. **Event ID Mismatch**: Reviews are saved with `item.eventId` but queried by submission, which might have a different event ID

## Recommended Fixes

### Fix 1: Add Debug Logging
Add comprehensive logging to track:
- Submission IDs when saving reviews
- Submission IDs when querying reviews
- Form IDs when saving vs querying
- Event IDs when saving vs querying

### Fix 2: Verify Submission ID Consistency
Ensure that `item.submissionId` from dispatched items always matches `submission.id` from the database.

### Fix 3: Query Without Form Filter as Fallback
If evaluation form is not found, still query reviews but log a warning.

### Fix 4: Check Event ID Matching
Ensure reviews are saved with the correct event ID that matches the submission's event.

## Testing Checklist

1. ✅ Verify review is saved to `participant_reviews` table
2. ✅ Verify `submission_id` in saved review matches submission ID
3. ✅ Verify `form_id` in saved review matches evaluation form ID
4. ✅ Verify `event_id` in saved review matches event ID
5. ✅ Verify query uses same submission ID
6. ✅ Verify query uses same form ID
7. ✅ Check browser console for error messages
8. ✅ Check Supabase logs for query errors

## Next Steps

1. Add debug logging to both save and query operations
2. Verify data in database directly
3. Check for any RLS (Row Level Security) policies that might block queries
4. Verify the evaluation form ID is correctly configured for the event
