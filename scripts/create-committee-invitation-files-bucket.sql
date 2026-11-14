-- Storage bucket for committee invitation email attachments
-- Run in Supabase SQL Editor once.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'committee-invitation-files',
  'committee-invitation-files',
  true,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload committee invitation files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view committee invitation files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own committee invitation files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own committee invitation files" ON storage.objects;

CREATE POLICY "Authenticated users can upload committee invitation files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'committee-invitation-files');

CREATE POLICY "Public can view committee invitation files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'committee-invitation-files');

CREATE POLICY "Users can update own committee invitation files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'committee-invitation-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'committee-invitation-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own committee invitation files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'committee-invitation-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
