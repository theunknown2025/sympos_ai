-- Fix participant_reviews that have incorrect event_id
-- This updates reviews to use the submission's actual event_id instead of the dispatch record's event_id

UPDATE participant_reviews pr
SET 
  event_id = fs.event_id,
  updated_at = NOW()
FROM form_submissions fs
WHERE pr.submission_id = fs.id
  AND pr.submission_type = 'submission'
  AND pr.event_id != fs.event_id;

-- Verify the fix
SELECT 
  pr.id as review_id,
  pr.submission_id,
  pr.event_id as review_event_id,
  fs.event_id as submission_event_id,
  pr.event_id = fs.event_id as event_id_matches,
  fs.event_title
FROM participant_reviews pr
JOIN form_submissions fs ON pr.submission_id = fs.id
WHERE pr.submission_type = 'submission'
ORDER BY pr.updated_at DESC;
