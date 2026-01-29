# Create Participant_Badge Bucket

The `Participant_Badge` bucket needs to be created in Supabase Storage and made public so that participants can view their badges.

## ✅ Status

**The bucket and RLS policies have been created via migration!** The bucket exists and all necessary storage policies are in place.

## Steps to Create the Bucket (if not already created)

If the bucket doesn't exist, you can create it via:

### Option 1: Supabase Dashboard
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `sympos-ai` (gcgxgtixscwpiiuenlub)
3. Navigate to **Storage** in the left sidebar
4. Click **New bucket**
5. Enter the following details:
   - **Name**: `Participant_Badge` (exact name, case-sensitive)
   - **Public bucket**: ✅ **Enable** (check this box - this is important!)
   - **File size limit**: 50MB (or as needed)
   - **Allowed MIME types**: Leave empty or add: `image/png,image/jpeg,image/jpg,image/gif,image/webp`
6. Click **Create bucket**

### Option 2: SQL Script
Run the SQL script: `scripts/create-participant-badge-bucket.sql` in the Supabase SQL Editor.

## Storage Policies

The following RLS policies have been created via migration:

1. **Authenticated users can upload participant badges** - Allows authenticated users to upload badge images
2. **Public can view participant badges** - Allows anyone to view badge images (public bucket)
3. **Authenticated users can update participant badges** - Allows authenticated users to update badge images
4. **Authenticated users can delete participant badges** - Allows authenticated users to delete badge images

These policies ensure that:
- Organizers can upload, update, and delete badges
- Participants can view their badges without authentication (public access)

## Important Notes

- The bucket name must be exactly `Participant_Badge` (case-sensitive)
- The bucket must be public so participants can view their badges without authentication
- Badge images are generated as PNG files and uploaded to this bucket
- The bucket is used by the `badgeGeneratorService.ts` service

## Testing

After creating the bucket, test by:
1. Approving a registration with a badge template selected
2. The badge should be generated and saved to the bucket
3. The badge should appear in the "Badge" column in the registrations view
4. Clicking the badge icon should open a preview modal showing the badge image
