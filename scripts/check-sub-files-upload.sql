-- ============================================
-- Check Files in Sub_Files Bucket
-- ============================================
-- Run this to see if files are actually being uploaded

-- Check all files in Sub_Files bucket
SELECT 
  name,
  id,
  bucket_id,
  owner,
  created_at,
  updated_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'Sub_Files'
ORDER BY created_at DESC;

-- Count files by user (folder)
SELECT 
  (storage.foldername(name))[1] as user_folder,
  COUNT(*) as file_count,
  SUM((metadata->>'size')::bigint) as total_size_bytes
FROM storage.objects
WHERE bucket_id = 'Sub_Files'
GROUP BY (storage.foldername(name))[1]
ORDER BY file_count DESC;

-- Check if bucket exists and is accessible
SELECT 
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets
WHERE id = 'Sub_Files';

-- ============================================
-- Check Storage Policies
-- ============================================
-- Verify policies are active
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%Sub_Files%';

-- ============================================
-- Test: Try to list files (simulates what the app does)
-- ============================================
-- This should work if policies are correct
SELECT COUNT(*) as total_files_in_bucket
FROM storage.objects
WHERE bucket_id = 'Sub_Files';

