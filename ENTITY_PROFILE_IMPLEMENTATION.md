# Entity Profile (Profile Folder) Implementation

## Overview
The Profile Folder feature has been successfully implemented in the admin sidebar. This feature allows organizers to manage comprehensive entity and representative information.

## What Was Implemented

### 1. Database Schema Updates
- **New Migration Script**: `scripts/migrate-organizer-profiles-add-fields.sql`
  - Adds new fields to the existing `organizer_profiles` table
  - Run this script in Supabase SQL Editor if the table already exists

- **Updated Table Creation Script**: `scripts/create-organizer-profiles-table.sql`
  - Includes all new fields for fresh installations

**New Fields Added:**
- `entity_creation_date` (DATE) - Date de création
- `entity_legal_status` (TEXT) - Statut juridique
- `entity_country` (TEXT) - Pays
- `entity_city` (TEXT) - Ville
- `entity_official_website` (TEXT) - Site web officiel
- `entity_mission` (TEXT) - Mission statement
- `entity_vision` (TEXT) - Vision statement
- `entity_scientific_domains` (TEXT/JSON) - Domaines scientifiques
- `representative_photo` (TEXT) - Representative photo

### 2. TypeScript Types
- Updated `OrganizerProfile` interface in `types.ts` with all new fields
- Added `ENTITY_PROFILE` to `ViewState` enum

### 3. Service Layer
- Updated `services/organizerProfileService.ts` to handle all new fields
- Supports saving and retrieving all entity and representative information

### 4. UI Components
- **EntityProfile Component** (`components/Admin/EntityProfile/EntityProfile.tsx`)
  - Comprehensive form for editing entity profile
  - Supports image uploads for logo, banner, and representative photo
  - Handles all required fields including:
    - Entity information (name, creation date, legal status, location, etc.)
    - Contact information (email, phone, address)
    - Mission and vision statements
    - Scientific domains (with tag management)
    - Representative information
  - Auto-saves to database

- **EntityProfilePreview Component** (`components/Admin/EntityProfile/EntityProfilePreview.tsx`)
  - Beautiful display view of the entity profile
  - Shows all information in an organized, readable format
  - Includes edit and delete actions

### 5. Navigation & Routing
- Added "Profile Folder" menu item to admin sidebar
- Added route: `/entity-profile`
- Updated `AppRoutes.tsx` to include EntityProfile component
- Updated `roleGuard.tsx` to restrict access to organizers only

## Features Included

### Entity Information
✅ Logo upload and display
✅ Banner upload and display
✅ Nom officiel de l'université / institution
✅ Date de création
✅ Statut juridique (publique / privée / fondation / consortium académique)
✅ Pays, ville
✅ Site web officiel
✅ Other links (name and link) - dynamic list
✅ Coordonnées (email institutionnel, téléphone)
✅ Mission et vision statements
✅ Domaines scientifiques - dynamic tag list

### Representative Information
✅ Photo upload and display
✅ Full Name
✅ Email
✅ Phone number
✅ Function

## Next Steps

### 1. Database Migration
If you have an existing `organizer_profiles` table, run the migration script:

```sql
-- Run this in Supabase SQL Editor
-- File: scripts/migrate-organizer-profiles-add-fields.sql
```

If you're creating a new table, use:
```sql
-- Run this in Supabase SQL Editor
-- File: scripts/create-organizer-profiles-table.sql
```

### 2. Storage Bucket
Ensure the `organizer-profiles` storage bucket exists in Supabase Storage. The component uses this bucket for logo, banner, and representative photo uploads.

### 3. Test the Feature
1. Log in as an organizer
2. Navigate to "Profile Folder" in the sidebar
3. Fill in the entity profile information
4. Upload logo, banner, and representative photo
5. Save and verify the preview displays correctly

## File Structure

```
components/Admin/EntityProfile/
├── EntityProfile.tsx          # Main form component
└── EntityProfilePreview.tsx    # Display/preview component

scripts/
├── create-organizer-profiles-table.sql      # Full table creation
└── migrate-organizer-profiles-add-fields.sql # Migration script

services/
└── organizerProfileService.ts  # Updated service with new fields
```

## Notes

- All image uploads are limited to 5MB
- Images are stored in the `organizer-profiles` storage bucket
- The form validates required fields (entity name is required)
- Scientific domains and links can be added/removed dynamically
- The preview view automatically formats dates and displays all information beautifully
