# Badge Templates Implementation

## Overview
Successfully implemented badge templates alongside certificate templates with full CRUD operations and visual distinction in the UI.

## Changes Made

### 1. Database & Storage
- **Table**: `badge_templates` - Same structure as `certificate_templates`
- **Bucket**: `badges` - Public bucket for badge images (50MB limit)
- **RLS Policies**: User-scoped access control for badge templates

### 2. Services Created
- `services/badgeTemplateService.ts` - Full CRUD operations for badges:
  - `saveBadgeTemplate()`
  - `updateBadgeTemplate()`
  - `getBadgeTemplate()`
  - `getUserBadgeTemplates()`
  - `deleteBadgeTemplate()`

### 3. UI Components

#### SaveTypeModal Component
- Modal dialog for selecting template type (Certificate or Badge)
- Shows when saving a new template
- Located at: `components/Admin/Certificates/SaveTypeModal.tsx`

#### CertificateTemplateBuilder Updates
- Shows modal when saving new templates
- For existing templates, uses the saved type (no modal)
- Handles uploads to correct bucket based on type
- Loads templates from both tables when editing

#### CertificateTemplateList Updates
- **Fetches both types**: Loads certificates and badges simultaneously
- **Filter buttons**: "All", "Certificates", "Badges" with counts
- **Visual distinction**: 
  - Purple badge icon for badges
  - Blue certificate icon for certificates
  - Displayed in top-right corner of template cards
- **Proper deletion**: Deletes from correct table based on type
- **Combined view**: Shows all templates sorted by update date

### 4. Configuration Updates
- `supabase.ts`:
  - Added `BADGE_TEMPLATES` table constant
  - Added `BADGES` bucket constant
- `storageService.ts`:
  - Updated to handle badge bucket uploads
  - Routes badge images to correct storage location

## How It Works

### Creating Templates
1. Click "New Template" in CertificateTemplateList
2. Design the template in CertificateTemplateBuilder
3. Click "Save Template"
4. Modal appears asking "Certificate or Badge?"
5. Select type and template is saved to appropriate table
6. Images uploaded to correct bucket (`badges` or `certificate-templates`)

### Viewing Templates
- List shows both certificates and badges
- Filter by type using the filter buttons
- Visual badge shows template type on each card
- Counts displayed for each filter option

### Editing Templates
- Click "Edit" on any template
- Builder loads the template (from correct table)
- Saves back to same table (no type change)

### Deleting Templates
- Click trash icon on template card
- Deletes from correct table based on template type

## Database Structure

### badge_templates Table
```sql
CREATE TABLE badge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  background_image TEXT,
  background_image_type TEXT,
  width INTEGER,
  height INTEGER,
  elements TEXT, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### badges Storage Bucket
- **Name**: `badges`
- **Public**: Yes
- **Size Limit**: 50MB
- **Allowed Types**: Images (JPEG, PNG, GIF, WebP, SVG, etc.) and PDF

## UI Features

### Filter Buttons
- **All**: Shows all templates (certificates + badges)
- **Certificates**: Shows only certificate templates
- **Badges**: Shows only badge templates
- Each button shows count in parentheses

### Template Cards
- Badge indicator in top-right corner
- Purple for badges, blue for certificates
- Icon + label for clear identification

### Empty States
- Context-aware messages based on filter
- "No templates yet" when list is empty
- "No [type] templates" when filter has no results

## Technical Notes

1. **Type Safety**: Extended `CertificateTemplate` with `TemplateWithType` interface
2. **Parallel Loading**: Uses `Promise.all()` to fetch both types simultaneously
3. **Sorting**: Combined list sorted by `updated_at` (most recent first)
4. **Error Handling**: Proper error messages for failed operations
5. **Storage Routing**: Automatic bucket selection based on template type

## Files Modified
- `components/Admin/Certificates/CertificateTemplateBuilder.tsx`
- `components/Admin/Certificates/CertificateTemplateList.tsx`
- `services/storageService.ts`
- `supabase.ts`

## Files Created
- `components/Admin/Certificates/SaveTypeModal.tsx`
- `services/badgeTemplateService.ts`
- `BADGE_TEMPLATES_IMPLEMENTATION.md` (this file)

## Testing Checklist
- [x] Create badge template
- [x] Create certificate template
- [x] View both types in list
- [x] Filter by type
- [x] Edit badge template
- [x] Edit certificate template
- [x] Delete badge template
- [x] Delete certificate template
- [x] Upload images to correct buckets
- [x] Visual distinction between types

## Future Enhancements
Consider these potential improvements:
1. Separate pages for certificates and badges
2. Bulk operations (delete multiple, duplicate)
3. Template preview modal
4. Template categories/tags
5. Template sharing between users
6. Template marketplace
