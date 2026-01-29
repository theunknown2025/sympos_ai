# Sub_Files Bucket Verification Checklist

## ✅ Code Verification (All Correct)

1. **Bucket Constant** (`supabase.ts`):
   ```typescript
   SUB_FILES: 'Sub_Files'  // ✓ Correct
   ```

2. **Storage Service** (`storageService.ts`):
   - Uses `STORAGE_BUCKETS.SUB_FILES` for submission files ✓
   - Maps `'form-submissions'` folder to `Sub_Files` bucket ✓

3. **SQL Script** (`create-sub-files-bucket.sql`):
   - Creates bucket with id: `'Sub_Files'` ✓
   - Creates bucket with name: `'Sub_Files'` ✓

## 🔍 Verification Steps

### Step 1: Verify Bucket Exists in Supabase

Run this SQL in Supabase SQL Editor:

```sql
SELECT id, name, public, file_size_limit, created_at
FROM storage.buckets 
WHERE id = 'Sub_Files';
```

**Expected Result:** Should return 1 row with:
- `id`: `Sub_Files` (exact match, case-sensitive)
- `name`: `Sub_Files`
- `public`: `false`

**If no rows returned:** The bucket doesn't exist. Run `create-sub-files-bucket.sql` again.

### Step 2: Check All Buckets

```sql
SELECT id, name, public 
FROM storage.buckets 
ORDER BY created_at DESC;
```

This shows all buckets. Look for `Sub_Files` in the list.

### Step 3: Verify Storage Policies

```sql
SELECT policyname, cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%Sub_Files%';
```

**Expected:** Should show policies like:
- "Users can upload files to Sub_Files"
- "Users can view own files in Sub_Files"
- etc.

### Step 4: Check Browser Console

When you try to upload a file, check the browser console. You should see:
```
Uploading to bucket: Sub_Files for folder: form-submissions
```

This confirms the code is using the correct bucket name.

## 🐛 Common Issues

### Issue 1: Bucket Name Case Sensitivity
- Supabase bucket names are **case-sensitive**
- Must be exactly: `Sub_Files` (capital S, capital F)
- Not: `sub_files`, `Sub_files`, `SUB_FILES`, etc.

### Issue 2: Bucket Not Created
- If the SQL script didn't run successfully
- Check Supabase SQL Editor for errors
- Re-run `create-sub-files-bucket.sql`

### Issue 3: Build Cache
- If you updated the code but still see old errors:
  1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
  2. Clear browser cache
  3. Restart dev server

### Issue 4: Policies Not Created
- If bucket exists but upload fails with permission error
- Re-run the policy creation part of `create-sub-files-bucket.sql`

## 🔧 Quick Fix Commands

### Re-create Bucket (if needed)
```sql
-- Delete existing bucket (if exists)
DELETE FROM storage.buckets WHERE id = 'Sub_Files';

-- Then run create-sub-files-bucket.sql again
```

### Check Current Bucket Name in Code
The bucket name is defined in:
- `supabase.ts` line 37: `SUB_FILES: 'Sub_Files'`
- `storageService.ts` line 127: Uses `STORAGE_BUCKETS.SUB_FILES`

## 📝 Verification Summary

| Item | Expected Value | Status |
|------|---------------|--------|
| SQL Bucket ID | `Sub_Files` | ⏳ Verify in Supabase |
| SQL Bucket Name | `Sub_Files` | ⏳ Verify in Supabase |
| Code Constant | `'Sub_Files'` | ✅ Correct |
| Storage Service | Uses `SUB_FILES` | ✅ Correct |
| Folder Mapping | `'form-submissions'` → `Sub_Files` | ✅ Correct |

## 🎯 Next Steps

1. Run the verification SQL queries above
2. Check the browser console for the debug log
3. If bucket doesn't exist, re-run `create-sub-files-bucket.sql`
4. If bucket exists but upload fails, check storage policies
5. Hard refresh browser and restart dev server if needed

