-- Allow participants to read certificate templates linked to their account certificates
DROP POLICY IF EXISTS "Participants can view templates for account certificates" ON certificate_templates;
CREATE POLICY "Participants can view templates for account certificates"
  ON certificate_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM certificates c
      WHERE c.template_id = certificate_templates.id
        AND c.participant_user_id = auth.uid()
    )
  );

-- Allow participants to read form submissions linked to their account certificates
DROP POLICY IF EXISTS "Participants can view submissions for account certificates" ON form_submissions;
CREATE POLICY "Participants can view submissions for account certificates"
  ON form_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM certificates c
      WHERE c.participant_submission_id = form_submissions.id
        AND c.participant_user_id = auth.uid()
    )
  );
