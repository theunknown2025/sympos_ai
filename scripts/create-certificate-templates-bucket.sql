-- ============================================
-- Create Storage Bucket: certificate-templates
-- ============================================
-- This bucket is for storing certificate template backgrounds and generated certificates
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificate-templates',
  'certificate-templates',
  true, -- Public bucket (files can be accessed via public URL)
  52428800, -- 50MB file size limit (for high-quality certificate images)
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
    -- PDFs (for certificate downloads)
    'application/pdf'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for certificate-templates Bucket
-- ============================================

-- Policy: Authenticated users can upload certificate templates and generated certificates
CREATE POLICY "Authenticated users can upload certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certificate-templates');

-- Policy: Anyone can view certificates (public bucket)
CREATE POLICY "Public can view certificates"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'certificate-templates');

-- Policy: Authenticated users can update their own certificates
CREATE POLICY "Users can update own certificates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'certificate-templates' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'certificate-templates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Authenticated users can delete their own certificates
CREATE POLICY "Users can delete own certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificate-templates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
