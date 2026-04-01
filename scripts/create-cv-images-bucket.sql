-- ============================================
-- Create Storage Bucket: cv-images
-- ============================================
-- This bucket is for storing CV profile images
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-images',
  'cv-images',
  true, -- Public bucket (files can be accessed via public URL)
  5242880, -- 5MB file size limit (for profile images)
  ARRAY[
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
-- Storage Policies for cv-images Bucket
-- ============================================

-- Policy: Authenticated users can upload CV images
CREATE POLICY "Authenticated users can upload CV images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cv-images');

-- Policy: Anyone can view CV images (public bucket)
CREATE POLICY "Public can view CV images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cv-images');

-- Policy: Authenticated users can update their own CV images
CREATE POLICY "Authenticated users can update own CV images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cv-images' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'cv-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Authenticated users can delete their own CV images
CREATE POLICY "Authenticated users can delete own CV images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cv-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- Verify the bucket was created
-- ============================================
-- SELECT * FROM storage.buckets WHERE id = 'cv-images';
