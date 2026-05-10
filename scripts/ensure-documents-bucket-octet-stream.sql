-- Allow generic binary MIME for PDFs/files that report as application/octet-stream (landing CTA document uploads).
-- Run in Supabase SQL Editor if document uploads fail with "mime type not allowed".

UPDATE storage.buckets
SET allowed_mime_types = COALESCE(allowed_mime_types, ARRAY[]::text[]) || ARRAY['application/octet-stream']::text[]
WHERE id = 'documents'
  AND NOT (COALESCE(allowed_mime_types, ARRAY[]::text[]) @> ARRAY['application/octet-stream']::text[]);
