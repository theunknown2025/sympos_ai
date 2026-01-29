-- ============================================
-- Create Storage Bucket: Participant_Badge
-- ============================================
-- This bucket is for storing generated participant badges
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Participant_Badge',
  'Participant_Badge',
  true, -- Public bucket (files can be accessed via public URL)
  52428800, -- 50MB file size limit (for badge images)
  ARRAY[
    -- Images
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
-- Storage Policies for Participant_Badge Bucket
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload participant badges" ON storage.objects;
DROP POLICY IF EXISTS "Public can view participant badges" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update participant badges" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete participant badges" ON storage.objects;

-- Policy: Authenticated users can upload badge images
CREATE POLICY "Authenticated users can upload participant badges"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Participant_Badge');

-- Policy: Anyone can view badge images (public bucket)
CREATE POLICY "Public can view participant badges"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Participant_Badge');

-- Policy: Authenticated users can update badge images
CREATE POLICY "Authenticated users can update participant badges"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'Participant_Badge')
WITH CHECK (bucket_id = 'Participant_Badge');

-- Policy: Authenticated users can delete badge images
CREATE POLICY "Authenticated users can delete participant badges"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'Participant_Badge');

-- ============================================
-- Verify the bucket was created
-- ============================================
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'Participant_Badge';

-- ============================================
-- Verify the policies were created
-- ============================================
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Upload'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
  END as operation
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%participant%badge%'
ORDER BY cmd;
