-- ============================================
-- Create Storage Bucket: email-attachments
-- ============================================
-- This bucket is for storing email attachment files
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-attachments',
  'email-attachments',
  true, -- Public bucket (files can be accessed via public URL)
  104857600, -- 100MB file size limit (adjust as needed)
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for email-attachments Bucket
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can upload email attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can view email attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update email attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete email attachments" ON storage.objects;

-- Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload email attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-attachments');

-- Policy: Anyone can view email attachments (public bucket)
CREATE POLICY "Public can view email attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-attachments');

-- Policy: Authenticated users can update email attachments
CREATE POLICY "Authenticated users can update email attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'email-attachments')
WITH CHECK (bucket_id = 'email-attachments');

-- Policy: Authenticated users can delete email attachments
CREATE POLICY "Authenticated users can delete email attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'email-attachments');

-- ============================================
-- Verify the bucket was created
-- ============================================
-- Run this query to verify:
-- SELECT * FROM storage.buckets WHERE id = 'email-attachments';
