-- ============================================
-- Verify Sub_Files Bucket Exists
-- ============================================
-- Run this in Supabase SQL Editor to verify the bucket was created correctly

-- Check if the bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'Sub_Files';

-- If the above returns no rows, the bucket doesn't exist.
-- If it returns a row, check:
-- 1. The id should be exactly 'Sub_Files' (case-sensitive)
-- 2. The name should be 'Sub_Files'
-- 3. public should be false (private bucket)

-- ============================================
-- Check Storage Policies for Sub_Files
-- ============================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%Sub_Files%';

-- ============================================
-- If bucket doesn't exist, create it:
-- ============================================
-- Run the create-sub-files-bucket.sql script

-- ============================================
-- List all buckets to see what exists
-- ============================================
SELECT id, name, public, created_at 
FROM storage.buckets 
ORDER BY created_at DESC;

