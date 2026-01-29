-- Migration: Add publish functionality to landing_pages table
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Add columns for publishing functionality
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

-- Create index on public_slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_landing_pages_public_slug ON landing_pages(public_slug);

-- Create index on is_published for filtering published pages
CREATE INDEX IF NOT EXISTS idx_landing_pages_is_published ON landing_pages(is_published);

-- Add comment to explain the columns
COMMENT ON COLUMN landing_pages.is_published IS 'Whether the landing page is published and publicly accessible';
COMMENT ON COLUMN landing_pages.public_slug IS 'Unique slug used in the public URL (e.g., /p/slug-name)';

-- ============================================
-- RLS POLICY: Allow public access to published landing pages
-- ============================================
-- This policy allows anyone (including unauthenticated users) to view published landing pages
CREATE POLICY "Public can view published landing_pages"
  ON landing_pages FOR SELECT
  USING (is_published = true);
