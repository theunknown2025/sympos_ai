-- ============================================
-- Make event_id nullable in projects table
-- ============================================
-- This allows projects to be created without an event

-- Drop the foreign key constraint first
ALTER TABLE projects 
  DROP CONSTRAINT IF EXISTS projects_event_id_fkey;

-- Make event_id nullable
ALTER TABLE projects 
  ALTER COLUMN event_id DROP NOT NULL;

-- Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE projects 
  ADD CONSTRAINT projects_event_id_fkey 
  FOREIGN KEY (event_id) 
  REFERENCES events(id) 
  ON DELETE SET NULL;

