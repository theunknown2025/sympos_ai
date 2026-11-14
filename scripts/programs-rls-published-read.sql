-- Allow any authenticated (or anon) user to read programs that are explicitly published on an event.
-- Organizers still use existing "own programs" policies; this adds a read path for participants.
-- Run after add-published-program-to-events.sql.

DROP POLICY IF EXISTS "Read programs published on events" ON programs;

CREATE POLICY "Read programs published on events"
ON programs FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM events e
    WHERE e.published_program_id = programs.id
  )
);
