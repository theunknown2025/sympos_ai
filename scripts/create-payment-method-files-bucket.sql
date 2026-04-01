-- This script creates the storage bucket for payment method files
-- Run this in your Supabase SQL Editor or via the Supabase CLI

-- Note: Storage buckets are created via the Storage API, not SQL
-- You can create the bucket via:
-- 1. Supabase Dashboard > Storage > New Bucket
-- 2. Or use the Supabase CLI: supabase storage create payment-method-files

-- However, we can set up the storage policies here:

-- Create storage policy for authenticated users to upload files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-method-files',
  'payment-method-files',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload payment method files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-method-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view their payment method files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-method-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their payment method files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-method-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
