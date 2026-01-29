-- RLS Policy: Allow public access to published landing pages
-- Run this in Supabase SQL Editor if you're getting permission errors when accessing published pages

-- Drop the policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Public can view published landing_pages" ON landing_pages;

-- Create policy to allow public access to published landing pages
CREATE POLICY "Public can view published landing_pages"
  ON landing_pages FOR SELECT
  USING (is_published = true);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'landing_pages' 
AND policyname = 'Public can view published landing_pages';
