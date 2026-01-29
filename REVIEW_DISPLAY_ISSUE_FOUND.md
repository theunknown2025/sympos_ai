# Review Display Issue - ROOT CAUSE FOUND

## Database Query Results

I queried the Supabase database and found the issue!

### Review Data Found

**From `participant_reviews` table:**
```json
{
  "id": "f2a1a853-aa0b-432a-a50b-f6f39fe662ef",
  "participant_id": "40e80046-c7b3-4112-b5a6-c86a3eef2ebc",
  "user_id": "8f0f3d19-8fe2-4180-8aea-cd24d1de3343",
  "event_id": "01c13bd6-0e2c-45fe-a2aa-3326ad901bda",  // ⚠️ WRONG EVENT ID
  "form_id": "32747fae-42f9-40df-83d9-6bb432759ef3",   // ✅ Correct evaluation form
  "submission_id": "658d01e1-5040-48ec-a1ac-265ce57e571c", // ✅ Correct submission ID
  "submission_type": "submission",
  "status": "completed",
  "answers": "{...}",
  "created_at": "2026-01-16 12:11:18.812116+00",
  "updated_at": "2026-01-16 14:10:42.778241+00"
}
```

**From `evaluation_answers` table:**
```json
{
  "id": "4a0f4d07-86cc-4cf6-a717-b78c703f207f",
  "evaluation_form_id": "32747fae-42f9-40df-83d9-6bb432759ef3", // ✅ Correct
  "user_id": "8f0f3d19-8fe2-4180-8aea-cd24d1de3343",
  "submitted_by": "badrhustler@gmail.com",
  "created_at": "2026-01-16 14:10:43.064376+00"
}
```

### Submission Data

**From `form_submissions` table:**
```json
{
  "id": "658d01e1-5040-48ec-a1ac-265ce57e571c",  // ✅ Matches review submission_id
  "form_id": "15203d14-cc38-462a-8497-c44c34077b38",  // Submission form (not evaluation form)
  "event_id": "02b13150-2c68-45ab-989d-1555db43b78e",  // ⚠️ DIFFERENT EVENT ID!
  "event_title": "International Conference on Future Tech 2024",
  "user_id": "c2f19ed4-5f75-42d7-8506-3f5c0bbf9afc",
  "submitted_by": "Anonymous",
  "created_at": "2026-01-16 12:01:54.161928+00"
}
```

### Event Data

**Event where review was saved:**
```json
{
  "id": "01c13bd6-0e2c-45fe-a2aa-3326ad901bda",
  "name": "Event Test",
  "evaluation_form_ids": ["32747fae-42f9-40df-83d9-6bb432759ef3"]  // ✅ Correct form
}
```

## 🚨 ROOT CAUSE IDENTIFIED

### The Problem

**Event ID Mismatch:**
- Review was saved with `event_id`: `01c13bd6-0e2c-45fe-a2aa-3326ad901bda` (Event Test)
- Submission actually belongs to `event_id`: `02b13150-2c68-45ab-989d-1555db43b78e` (International Conference on Future Tech 2024)

### Why This Happens

When a participant saves a review:
1. The review uses `item.eventId` from the dispatched item
2. The dispatched item gets its `eventId` from the dispatch record's `event_id`
3. **The dispatch record might have the wrong event_id!**

### Impact

When the admin queries for reviews:
1. They load submissions for event `02b13150-2c68-45ab-989d-1555db43b78e`
2. They query reviews for submission `658d01e1-5040-48ec-a1ac-265ce57e571c`
3. The query finds the review (because `submission_id` matches)
4. **BUT** the review has `event_id` = `01c13bd6-0e2c-45fe-a2aa-3326ad901bda` (different event)
5. This might cause filtering issues or the review might not show up correctly

## The Fix

### Option 1: Fix the Review Save Logic (Recommended)

When saving a review, use the submission's actual `event_id` instead of the dispatch record's `event_id`:

**In `ReviewForm.tsx`:**
```typescript
// Instead of using item.eventId, get the event_id from the submission itself
const submissionEventId = item.submission.eventId || item.eventId;

await saveReview({
  participantId,
  userId: currentUser.id,
  eventId: submissionEventId, // Use submission's event_id
  formId: evaluationFormId,
  submissionId: item.submissionId,
  submissionType: item.submissionType,
  status,
  answers,
});
```

### Option 2: Fix the Dispatch Record

Ensure dispatch records have the correct `event_id` that matches the submission's event.

### Option 3: Query Without Event Filter

The current query in `SubmissionsEvaluation.tsx` already filters by `submission_id` and `form_id`, which should work. But we should verify the event_id doesn't interfere.

## Verification

The review **should** still be found because:
- ✅ `submission_id` matches: `658d01e1-5040-48ec-a1ac-265ce57e571c`
- ✅ `form_id` matches: `32747fae-42f9-40df-83d9-6bb432759ef3`

But the `event_id` mismatch might cause issues if:
- The query filters by event_id
- The UI groups reviews by event
- There are RLS policies that filter by event_id

## Next Steps

1. **Verify the query works** - Check if the review appears in SubmissionsEvaluation despite the event_id mismatch
2. **Fix the save logic** - Use submission's event_id when saving reviews
3. **Fix existing data** - Update the review's event_id to match the submission's event_id

## SQL to Fix Existing Data

```sql
-- Update the review's event_id to match the submission's event_id
UPDATE participant_reviews pr
SET event_id = fs.event_id
FROM form_submissions fs
WHERE pr.submission_id = fs.id
  AND pr.event_id != fs.event_id
  AND pr.submission_type = 'submission';
```
