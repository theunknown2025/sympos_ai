-- Add attached_files to opportunities (if module was installed before file uploads).
-- Run after create-opportunity-files-bucket.sql

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS attached_files JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN opportunities.attached_files IS
  'Array of { id, fileName, fileUrl, fileSize?, fileType? } for organizer-uploaded documents.';
