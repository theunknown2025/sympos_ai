-- Migration: Add banner column to events table
-- This migration adds a banner column to store banner configuration as JSON

-- Step 1: Add banner column (as TEXT to store JSON)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS banner TEXT;

-- Step 2: Add comment to document the column
COMMENT ON COLUMN events.banner IS 'JSON string storing EventBanner configuration. Example: {"type":"gradient","gradientColors":{"from":"#4f46e5","to":"#7c3aed","direction":"to-r"}}';

-- Migration complete!
-- The banner column will store JSON strings representing the EventBanner interface:
-- {
--   type: 'image' | 'color' | 'gradient',
--   imageUrl?: string,
--   imagePositionY?: number,
--   color?: string,
--   gradientColors?: {
--     from: string,
--     to: string,
--     direction?: 'to-r' | 'to-l' | 'to-b' | 'to-t' | 'to-br' | 'to-bl' | 'to-tr' | 'to-tl'
--   }
-- }
