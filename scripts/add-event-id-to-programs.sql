-- ============================================
-- Add event_id column to programs table
-- ============================================
-- This migration adds an event_id column to link programs to events
-- Run this in Supabase SQL Editor

-- Add event_id column (nullable, can be set later)
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

-- Create index for faster queries by event
CREATE INDEX IF NOT EXISTS idx_programs_event_id ON programs(event_id);

-- Add comment to column
COMMENT ON COLUMN programs.event_id IS 'The event this program is associated with';
