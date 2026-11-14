-- Storage bucket for opportunity attachments (organizer uploads on create/edit).
-- Run in Supabase SQL Editor once.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'opportunity-files',
  'opportunity-files',
  true,
  52428800, -- 50 MB per file
  NULL -- allow common document/image types via client; omit strict list for flexibility
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload
DROP POLICY IF EXISTS "Authenticated users can upload opportunity files" ON storage.objects;
CREATE POLICY "Authenticated users can upload opportunity files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'opportunity-files');

-- Public read (published opportunities show attachments to participants)
DROP POLICY IF EXISTS "Public can view opportunity files" ON storage.objects;
CREATE POLICY "Public can view opportunity files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'opportunity-files');

DROP POLICY IF EXISTS "Authenticated users can update opportunity files" ON storage.objects;
CREATE POLICY "Authenticated users can update opportunity files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'opportunity-files')
  WITH CHECK (bucket_id = 'opportunity-files');

DROP POLICY IF EXISTS "Authenticated users can delete opportunity files" ON storage.objects;
CREATE POLICY "Authenticated users can delete opportunity files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'opportunity-files');

-- DB column for file metadata (replaces main_criteria text usage)
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS attached_files JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN opportunities.attached_files IS
  'Array of { id, fileName, fileUrl, fileSize?, fileType? } for organizer-uploaded documents.';
