-- Script to set default roles for existing users who don't have roles
-- This ensures backward compatibility for users registered before role-based access was implemented

-- Update users who don't have a role in their metadata
-- Default to 'Participant' for existing users
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "Participant"}'::jsonb
WHERE raw_user_meta_data->>'role' IS NULL;

-- Note: This script updates user metadata directly in Supabase
-- Run this in Supabase SQL Editor if you have existing users without roles

