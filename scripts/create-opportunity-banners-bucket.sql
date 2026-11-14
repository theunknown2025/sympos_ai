-- Opportunity header banners (Supabase project: gcgxgtixscwpiiuenlub via MCP).
-- Run in Supabase SQL Editor once.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'opportunity-banners',
  'opportunity-banners',
  true,
  10485760,
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

DROP POLICY IF EXISTS "Authenticated users can upload opportunity banners" ON storage.objects;
DROP POLICY IF EXISTS "Public can view opportunity banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own opportunity banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own opportunity banners" ON storage.objects;

CREATE POLICY "Authenticated users can upload opportunity banners"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'opportunity-banners');

CREATE POLICY "Public can view opportunity banners"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'opportunity-banners');

CREATE POLICY "Users can update own opportunity banners"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'opportunity-banners' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'opportunity-banners' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own opportunity banners"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'opportunity-banners' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS banner JSONB;

COMMENT ON COLUMN opportunities.banner IS
  'Banner config: type image|color|gradient, imageUrl, imageOverlay, colors.';
