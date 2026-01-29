-- ============================================
-- Add status column to participant_reviews table
-- ============================================
-- This adds a status field to track if a review is a draft or completed
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Add status column with default value 'draft'
ALTER TABLE participant_reviews
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed'));

-- Update existing reviews to 'completed' status (assuming they were already submitted)
UPDATE participant_reviews
SET status = 'completed'
WHERE status IS NULL OR status = 'draft';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_participant_reviews_status 
ON participant_reviews(status);

-- Create index for querying by participant and status
CREATE INDEX IF NOT EXISTS idx_participant_reviews_participant_status 
ON participant_reviews(participant_id, status);
