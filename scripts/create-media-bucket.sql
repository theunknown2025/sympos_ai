-- ============================================
-- Create Storage Bucket: media
-- ============================================
-- This bucket is for storing media files (images, videos)
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true, -- Public bucket (files can be accessed via public URL)
  524288000, -- 500MB file size limit (for videos, adjust as needed)
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
    'image/x-icon',
    -- Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
    'video/ogg',
    'video/x-matroska',
    'video/3gpp',
    'video/3gpp2'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for media Bucket
-- ============================================

-- Policy: Authenticated users can upload media files
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Policy: Anyone can view media files (public bucket)
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Policy: Authenticated users can update media files
CREATE POLICY "Authenticated users can update media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

-- Policy: Authenticated users can delete media files
CREATE POLICY "Authenticated users can delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');

-- ============================================
-- Verify the bucket was created
-- ============================================
-- Run this query to verify:
-- SELECT * FROM storage.buckets WHERE id = 'media';

