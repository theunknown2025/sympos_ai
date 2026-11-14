-- Custom label for the opportunity process steps section (editor + preview).
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS steps_section_title TEXT;

COMMENT ON COLUMN opportunities.steps_section_title IS
  'Organizer-defined heading for the application process timeline (e.g. Process steps).';
