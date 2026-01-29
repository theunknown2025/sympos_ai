# Review Display Issue - Fix Summary

## Issue
Participant reviews submitted through the review form are not appearing in the Submissions Evaluation view.

## Root Cause Analysis

After auditing the code, I've identified the following potential issues:

### 1. **ID Matching Issues**
The review query relies on exact matches for:
- `submission_id` - Must match between saved review and query
- `form_id` - Must match the evaluation form ID
- `event_id` - Should match but not used in query filter

### 2. **Data Flow Verification**

**When Saving (Participant):**
- `submissionId`: Comes from `item.submissionId` (from dispatched items)
- `formId`: Uses `evaluationFormId` from event's `evaluationFormIds[0]`
- `eventId`: Uses `item.eventId` from dispatched item

**When Querying (Admin):**
- `submissionId`: Uses `submission.id` from `getEventSubmissions()`
- `formId`: Uses `evaluationForm.id` from event's `evaluationFormIds[0]`

**Potential Mismatch:**
- If `item.submissionId` ≠ `submission.id`, reviews won't be found
- If evaluation form ID changed after reviews were saved, old reviews won't show
- If event has multiple evaluation forms, might query wrong form

## Debugging Added

I've added comprehensive logging to help identify the issue:

### 1. **ReviewForm.tsx** (Participant Side)
- Logs all IDs when saving a review
- Logs data types to catch type mismatches
- Logs the saved review ID

### 2. **SubmissionsEvaluation.tsx** (Admin Side)
- Logs submission ID, form ID, and event ID when querying
- Logs each review found with matching status
- Performs direct database query if no reviews found to compare results
- Shows detailed comparison of IDs

### 3. **reviewService.ts** (Service Layer)
- Logs query parameters before executing
- Logs existing review check results
- Logs query results with review details

## How to Diagnose

1. **Open Browser Console** when:
   - Participant submits a review
   - Admin views Submissions Evaluation

2. **Look for these log messages:**
   ```
   [ReviewForm] Saving review with: {...}
   [saveReview] Checking for existing review: {...}
   [SubmissionsEvaluation] Querying reviews for submission {...}
   [getReviewsForSubmission] Querying with: {...}
   ```

3. **Compare the IDs:**
   - Check if `submissionId` when saving matches `submissionId` when querying
   - Check if `formId` when saving matches `formId` when querying
   - Check if data types match (string vs UUID)

4. **Check Direct Query Results:**
   - If no reviews found, the code now performs a direct query without form filter
   - Compare the direct query results with the filtered query

## Common Issues to Check

### Issue 1: Submission ID Mismatch
**Symptom:** Reviews saved but not found in query
**Check:**
- Compare `item.submissionId` (from dispatch) with `submission.id` (from database)
- Verify the dispatch record uses the correct submission ID

### Issue 2: Form ID Mismatch
**Symptom:** Reviews found in direct query but not in filtered query
**Check:**
- Verify event has `evaluationFormIds` configured
- Verify the evaluation form ID hasn't changed
- Check if multiple evaluation forms exist

### Issue 3: Event ID Mismatch
**Symptom:** Reviews saved but not showing for correct event
**Check:**
- Verify `item.eventId` matches the submission's event
- Check if submission was moved to different event

### Issue 4: RLS (Row Level Security) Policies
**Symptom:** Query returns empty but data exists
**Check:**
- Verify RLS policies allow admin to read `participant_reviews`
- Check if policies filter by user_id or other fields

## Next Steps

1. **Test the Flow:**
   - Have a participant submit a review
   - Check browser console for save logs
   - Have admin view Submissions Evaluation
   - Check browser console for query logs
   - Compare the IDs

2. **Verify Database:**
   - Query `participant_reviews` table directly
   - Check if review exists with correct IDs
   - Verify `submission_id`, `form_id`, and `event_id` values

3. **Check Supabase Logs:**
   - Look for query errors
   - Check for RLS policy violations
   - Verify query execution

4. **If Issue Persists:**
   - Share console logs
   - Share database query results
   - Check for any error messages

## Files Modified

1. `components/Participant/reviews/ReviewForm.tsx` - Added save logging
2. `components/Admin/Submissions/ManageSubmission/SubmissionsEvaluation.tsx` - Added query logging and direct query fallback
3. `services/reviewService.ts` - Added service-level logging

## Expected Behavior

After these changes:
1. Console will show detailed logs of all ID values
2. Direct database query will help identify if issue is with filtering
3. Type information will help catch type mismatches
4. Review matching status will show if IDs match correctly

## Testing Checklist

- [ ] Participant can save review (check console logs)
- [ ] Review appears in `participant_reviews` table
- [ ] Admin can query reviews (check console logs)
- [ ] IDs match between save and query
- [ ] Reviews appear in Submissions Evaluation view
- [ ] No console errors
- [ ] Direct query shows reviews if filtered query doesn't
