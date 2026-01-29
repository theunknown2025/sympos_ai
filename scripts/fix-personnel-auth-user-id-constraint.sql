-- ============================================
-- FIX PERSONNEL AUTH_USER_ID FOREIGN KEY CONSTRAINT
-- ============================================
-- This script fixes the foreign key constraint to allow NULL values
-- Run this in Supabase SQL Editor if you're getting foreign key constraint violations

-- Step 1: Drop ALL existing constraints on auth_user_id
DO $$ 
DECLARE
    constraint_name TEXT;
    auth_user_id_attnum SMALLINT;
BEGIN
    -- Get the attribute number for auth_user_id
    SELECT attnum INTO auth_user_id_attnum
    FROM pg_attribute 
    WHERE attrelid = 'personnel'::regclass 
    AND attname = 'auth_user_id';
    
    -- Find and drop all foreign key constraints on auth_user_id
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'personnel'::regclass
        AND confrelid = 'auth.users'::regclass
        AND conkey = ARRAY[auth_user_id_attnum]
    LOOP
        EXECUTE format('ALTER TABLE personnel DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Step 2: Ensure the column allows NULL
ALTER TABLE personnel 
ALTER COLUMN auth_user_id DROP NOT NULL;

-- Step 3: Recreate the foreign key constraint with proper NULL handling
ALTER TABLE personnel 
ADD CONSTRAINT personnel_auth_user_id_fkey 
FOREIGN KEY (auth_user_id) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Step 4: Verify the constraint was created correctly
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    CASE confupdtype 
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
    END AS on_update,
    CASE confdeltype 
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
    END AS on_delete,
    (SELECT is_nullable 
     FROM information_schema.columns 
     WHERE table_name = 'personnel' 
     AND column_name = 'auth_user_id') AS allows_null
FROM pg_constraint 
WHERE conname = 'personnel_auth_user_id_fkey';

-- Step 5: Test that NULL can be inserted (this should work now)
-- You can uncomment this to test, but it will insert a test record
-- INSERT INTO personnel (user_id, full_name, email, role, auth_user_id) 
-- VALUES ((SELECT id FROM auth.users LIMIT 1), 'Test', 'test@example.com', 'Test', NULL);

