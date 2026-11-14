-- Link generated certificates to participant accounts (Participations → Certificates)
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS participant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS certificate_scope TEXT CHECK (
    certificate_scope IS NULL OR certificate_scope IN ('registration', 'submission')
  );

CREATE INDEX IF NOT EXISTS idx_certificates_participant_user_id ON certificates(participant_user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_participant_scope ON certificates(participant_user_id, certificate_scope);

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_participant_account_unique
  ON certificates(participant_submission_id, certificate_scope)
  WHERE participant_user_id IS NOT NULL AND certificate_scope IS NOT NULL;

DROP POLICY IF EXISTS "Participants can view own account certificates" ON certificates;
CREATE POLICY "Participants can view own account certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (participant_user_id = auth.uid());
