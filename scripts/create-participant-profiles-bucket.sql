-- ============================================
-- Create Storage Bucket: participant-profiles
-- ============================================
-- This bucket is for storing participant profile images
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'participant-profiles',
  'participant-profiles',
  true, -- Public bucket (files can be accessed via public URL)
  10485760, -- 10MB file size limit (for images)
  ARRAY[
    -- Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/x-icon'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for participant-profiles Bucket
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload participant profiles" ON storage.objects;
DROP POLICY IF EXISTS "Public can view participant profiles" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own participant profiles" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own participant profiles" ON storage.objects;

-- Policy: Authenticated users can upload profile images
CREATE POLICY "Authenticated users can upload participant profiles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'participant-profiles');

-- Policy: Anyone can view profile images (public bucket)
CREATE POLICY "Public can view participant profiles"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'participant-profiles');

-- Policy: Authenticated users can update their own profile images
CREATE POLICY "Users can update own participant profiles"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'participant-profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'participant-profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Authenticated users can delete their own profile images
CREATE POLICY "Users can delete own participant profiles"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'participant-profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Verify the bucket was created
-- ============================================
-- Run this query to verify:
-- SELECT * FROM storage.buckets WHERE id = 'participant-profiles';
