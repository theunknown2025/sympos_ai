-- Expand Sub_Files allowed MIME types so common uploads (CSV, WebP, octet-stream) are not rejected.
-- Run in Supabase SQL Editor if participant file uploads fail with MIME / content-type errors.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/octet-stream',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]::text[]
WHERE id = 'Sub_Files';
