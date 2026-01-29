# Troubleshooting: Files Not Appearing in Sub_Files Bucket

## Problem
Submission form shows files are saved, but the `Sub_Files` bucket appears empty.

## Diagnostic Steps

### Step 1: Check Browser Console
When uploading a file, check the browser console (F12 → Console tab). You should see:
```
Uploading to bucket: Sub_Files for folder: form-submissions
Upload details: { bucket: 'Sub_Files', fileName: '...', ... }
Upload successful: { path: '...', id: '...', bucket: 'Sub_Files' }
File URL generated: https://...
```

**If you see errors:** Note the error message and status code.

### Step 2: Verify Files Actually Uploaded
Run this SQL in Supabase SQL Editor:

```sql
-- Check all files in Sub_Files bucket
SELECT 
  name,
  id,
  bucket_id,
  owner,
  created_at,
  (metadata->>'size')::bigint as size_bytes
FROM storage.objects
WHERE bucket_id = 'Sub_Files'
ORDER BY created_at DESC;
```

**If this returns files:** The files ARE uploaded, but might not be visible in the Supabase dashboard due to permissions.

**If this returns no rows:** Files are not being uploaded (check Step 3).

### Step 3: Check Storage Policies
Run this SQL:

```sql
-- Verify policies exist and are correct
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%Sub_Files%';
```

**Expected policies:**
- "Users can upload files to Sub_Files" (INSERT)
- "Users can view own files in Sub_Files" (SELECT)
- "Users can update own files in Sub_Files" (UPDATE)
- "Users can delete own files in Sub_Files" (DELETE)
- "Organizers can view all files in Sub_Files" (SELECT)

### Step 4: Test Upload Permissions
The upload policy requires:
```sql
bucket_id = 'Sub_Files' AND
(storage.foldername(name))[1] = auth.uid()::text
```

This means:
- Files must be in `Sub_Files` bucket
- First folder in path must match your user ID

**Verify your user ID matches the folder:**
```sql
-- Get your current user ID
SELECT auth.uid() as current_user_id;

-- Check files with your user ID as folder
SELECT name, created_at
FROM storage.objects
WHERE bucket_id = 'Sub_Files'
  AND (storage.foldername(name))[1] = auth.uid()::text;
```

### Step 5: Check Bucket Configuration
```sql
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'Sub_Files';
```

**Verify:**
- `id` = `Sub_Files` (exact match, case-sensitive)
- `public` = `false` (private bucket)
- `file_size_limit` = `52428800` (50MB) or your limit
- `allowed_mime_types` includes your file type

## Common Issues & Solutions

### Issue 1: Files Upload But Not Visible in Dashboard
**Symptom:** SQL query shows files, but Supabase dashboard shows empty bucket.

**Cause:** Dashboard might filter by permissions or have caching issues.

**Solution:** 
- Files are actually there (use SQL to verify)
- Use the SQL queries to manage files
- Or make bucket public temporarily to view in dashboard (not recommended for production)

### Issue 2: Upload Succeeds But No Files in Bucket
**Symptom:** Console shows "Upload successful" but SQL shows no files.

**Possible causes:**
1. **Wrong bucket:** Files going to different bucket
   - Check console log: `Uploading to bucket: ...`
   - Should show `Sub_Files`

2. **Policy blocking:** INSERT policy not working
   - Check if policy exists (Step 3)
   - Verify user ID matches folder name

3. **Transaction rollback:** Upload succeeds but transaction fails
   - Check for errors after upload
   - Check if submission save fails

### Issue 3: Permission Denied Errors
**Symptom:** Console shows permission/403 errors.

**Solution:**
1. Re-run storage policies from `create-sub-files-bucket.sql`
2. Verify you're authenticated: `SELECT auth.uid();`
3. Check if your user ID matches the folder in file path

### Issue 4: Bucket Not Found Errors
**Symptom:** Console shows "Bucket not found" error.

**Solution:**
1. Verify bucket exists: `SELECT * FROM storage.buckets WHERE id = 'Sub_Files';`
2. Check bucket name is exactly `Sub_Files` (case-sensitive)
3. Re-run `create-sub-files-bucket.sql` if needed

## Quick Fix: Re-create Policies

If policies are missing or incorrect, run this:

```sql
-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can upload files to Sub_Files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files in Sub_Files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in Sub_Files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in Sub_Files" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can view all files in Sub_Files" ON storage.objects;

-- Then re-run the policy creation section from create-sub-files-bucket.sql
```

## Debug Checklist

- [ ] Browser console shows upload attempt
- [ ] Console shows correct bucket name (`Sub_Files`)
- [ ] Console shows upload success (not just "no error")
- [ ] SQL query shows files in bucket
- [ ] Storage policies exist and are correct
- [ ] User ID matches folder name in file path
- [ ] Bucket exists and is configured correctly
- [ ] File size is within limit
- [ ] File type is in allowed_mime_types

## Next Steps

1. **Check browser console** when uploading - look for the new debug logs
2. **Run the SQL queries** above to verify files exist
3. **Check storage policies** are correct
4. **Verify bucket configuration** matches expected values

If files still don't appear after checking all of the above, the issue might be:
- CORS configuration (files upload but fail silently)
- Network issues (upload appears to succeed but doesn't)
- Supabase dashboard caching (files exist but dashboard doesn't refresh)

