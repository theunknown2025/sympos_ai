-- ============================================
-- Create Storage Bucket: organizer-profiles
-- ============================================
-- This bucket is for storing organizer profile images (logos and banners)
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new
-- 
-- Note: This creates a dedicated bucket, but the app currently uses the 'media' bucket
-- You can use this if you want a separate bucket for organizer profiles

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organizer-profiles',
  'organizer-profiles',
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
-- Storage Policies for organizer-profiles Bucket
-- ============================================

-- Policy: Authenticated users can upload profile images
CREATE POLICY "Authenticated users can upload organizer profiles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organizer-profiles');

-- Policy: Anyone can view profile images (public bucket)
CREATE POLICY "Public can view organizer profiles"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organizer-profiles');

-- Policy: Authenticated users can update their own profile images
CREATE POLICY "Users can update own organizer profiles"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organizer-profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'organizer-profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Authenticated users can delete their own profile images
CREATE POLICY "Users can delete own organizer profiles"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organizer-profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Verify the bucket was created
-- ============================================
-- Run this query to verify:
-- SELECT * FROM storage.buckets WHERE id = 'organizer-profiles';
