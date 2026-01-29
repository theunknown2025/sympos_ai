-- ============================================
-- Update Storage Policies for Sub_Files Bucket
-- ============================================
-- This script updates the Sub_Files bucket policies to allow participants
-- (authenticated users) to read all files in the bucket for reviewing submissions.
-- Uploads are still restricted to users' own folders.
-- 
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- ============================================
-- Step 1: Drop existing SELECT policies
-- ============================================
-- Drop the old restrictive SELECT policies
DROP POLICY IF EXISTS "Users can view own files in Sub_Files" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can view all files in Sub_Files" ON storage.objects;

-- ============================================
-- Step 2: Create new SELECT policy for all authenticated users
-- ============================================
-- Policy: All authenticated users can view all files in Sub_Files
-- This allows participants (jury members) to view submission files they're reviewing
CREATE POLICY "Authenticated users can view all files in Sub_Files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'Sub_Files');

-- ============================================
-- Step 3: Ensure bucket exists (create if it doesn't)
-- ============================================
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
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- Step 4: Ensure INSERT policy exists (for uploads)
-- ============================================
-- Policy: Users can upload files to their own folder
DROP POLICY IF EXISTS "Users can upload files to Sub_Files" ON storage.objects;
CREATE POLICY "Users can upload files to Sub_Files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Sub_Files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Step 5: Ensure UPDATE policy exists
-- ============================================
-- Policy: Users can update their own files
DROP POLICY IF EXISTS "Users can update own files in Sub_Files" ON storage.objects;
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

-- ============================================
-- Step 6: Ensure DELETE policy exists
-- ============================================
-- Policy: Users can delete their own files
DROP POLICY IF EXISTS "Users can delete own files in Sub_Files" ON storage.objects;
CREATE POLICY "Users can delete own files in Sub_Files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'Sub_Files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Verification Queries
-- ============================================
-- Run these queries to verify the bucket and policies:

-- 1. Check if bucket exists
-- SELECT * FROM storage.buckets WHERE id = 'Sub_Files';

-- 2. Check all policies for Sub_Files bucket
-- SELECT 
--   policyname,
--   cmd,
--   roles,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage'
--   AND tablename = 'objects'
--   AND policyname LIKE '%Sub_Files%'
-- ORDER BY policyname;

-- Expected policies:
-- - "Authenticated users can view all files in Sub_Files" (SELECT, authenticated, no restrictions)
-- - "Users can upload files to Sub_Files" (INSERT, authenticated, folder restriction)
-- - "Users can update own files in Sub_Files" (UPDATE, authenticated, folder restriction)
-- - "Users can delete own files in Sub_Files" (DELETE, authenticated, folder restriction)
