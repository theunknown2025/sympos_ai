-- ============================================
-- ADD PASSWORD COLUMN TO PERSONNEL TABLE
-- ============================================
-- This script adds a password column to store passwords for manually created personnel
-- Run this in Supabase SQL Editor

-- Add password column (nullable - only for manually created personnel)
ALTER TABLE personnel 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Add comment to document the column
COMMENT ON COLUMN personnel.password IS 'Password for manually created personnel (stored in plain text for retrieval). For personnel added from participants, this will be NULL as they use their existing account.';

-- Note: In production, consider encrypting passwords before storing them
-- For now, we store them in plain text to allow retrieval/editing as requested

