-- ============================================
-- Create Storage Bucket: Sub_Files
-- ============================================
-- This bucket is for storing submission files (papers, documents, etc.)
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Sub_Files',
  'Sub_Files',
  false, -- Private bucket (users need authentication to access)
  52428800, -- 50MB file size limit (adjust as needed)
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
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for Sub_Files Bucket
-- ============================================

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload files to Sub_Files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Sub_Files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own files in Sub_Files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'Sub_Files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files in Sub_Files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Sub_Files' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'Sub_Files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files in Sub_Files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'Sub_Files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Organizers can view all files in Sub_Files (for managing submissions)
-- Note: This policy allows organizers to view all files. 
-- If you don't need organizer access, you can comment out or remove this policy.
-- Alternative: If JWT metadata doesn't work, you can create a separate policy
-- that checks against a user_roles table or use service role for admin access.
CREATE POLICY "Organizers can view all files in Sub_Files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'Sub_Files' AND
  (
    -- Allow if user is viewing their own files
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Allow if user is an organizer (use -> for jsonb access, then ->> for text value)
    ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Organizer')
  )
);

-- Alternative: If the above organizer policy doesn't work, you can use this simpler version
-- that only allows users to access their own files (remove the organizer policy above first):
-- 
-- CREATE POLICY "Users can view own files in Sub_Files (simple)"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'Sub_Files' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- ============================================
-- Verify the bucket was created
-- ============================================
-- Run this query to verify:
-- SELECT * FROM storage.buckets WHERE id = 'Sub_Files';

