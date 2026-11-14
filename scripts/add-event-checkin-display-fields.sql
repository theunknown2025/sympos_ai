-- Configurable form fields shown during organizer check-in (registration vs submission).
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS registration_checkin_display_field_keys TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS submission_checkin_display_field_keys TEXT DEFAULT '[]';

COMMENT ON COLUMN events.registration_checkin_display_field_keys IS 'JSON array of field keys (registration:{formId}:{fieldId}) shown at registration check-in';
COMMENT ON COLUMN events.submission_checkin_display_field_keys IS 'JSON array of field keys (submission:{formId}:{fieldId}) shown at submission presenter check-in';
