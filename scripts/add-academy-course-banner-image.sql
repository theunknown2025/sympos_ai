-- ============================================
-- Add Academy Course Banner Image
-- ============================================
-- Adds banner_image_url to academy_courses and creates the
-- academy-course-banners storage bucket with policies.
--
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

ALTER TABLE academy_courses
ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academy-course-banners',
  'academy-course-banners',
  true,
  10485760, -- 10MB
  ARRAY[
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload academy course banners" ON storage.objects;
DROP POLICY IF EXISTS "Public can view academy course banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own academy course banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own academy course banners" ON storage.objects;

-- Policy: Authenticated users can upload banners
CREATE POLICY "Authenticated users can upload academy course banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'academy-course-banners');

-- Policy: Anyone can view banners (public bucket)
CREATE POLICY "Public can view academy course banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'academy-course-banners');

-- Policy: Authenticated users can update their own banners
CREATE POLICY "Users can update own academy course banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'academy-course-banners' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'academy-course-banners' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Authenticated users can delete their own banners
CREATE POLICY "Users can delete own academy course banners"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'academy-course-banners' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
