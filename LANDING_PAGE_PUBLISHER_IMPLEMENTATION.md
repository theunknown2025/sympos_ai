# Landing Page Publisher Implementation

## Overview
This implementation adds publishing functionality to the Landing Page Builder, allowing users to publish their landing pages and make them publicly accessible via a unique URL.

## Features Implemented

### 1. Publisher Folder Structure
Created a new `Publisher` folder under `components/Admin/LPBuilder/` containing:
- `PublicLandingPageViewer.tsx` - Component for viewing published landing pages (public access, no authentication required)
- `index.ts` - Export file for the Publisher module

### 2. Database Schema Updates
Added two new columns to the `landing_pages` table:
- `is_published` (BOOLEAN) - Indicates if the landing page is published
- `public_slug` (TEXT, UNIQUE) - Unique slug used in the public URL

**Migration Script**: `scripts/add-landing-page-publish-columns.sql`

### 3. Service Layer Updates
Updated `services/landingPageService.ts` with:
- Updated `SavedLandingPage` interface to include:
  - `isPublished?: boolean`
  - `publicSlug?: string`
  - `publishedUrl?: string`
- `publishLandingPage(pageId: string)` - Publishes a landing page and generates a unique slug
- `unpublishLandingPage(pageId: string)` - Unpublishes a landing page
- `getPublishedLandingPage(slug: string)` - Retrieves a published landing page by slug (public access)

### 4. UI Updates

#### LandingPageManager Component
- Added **Publish** button for unpublished pages
- Added **Unpublish** button for published pages
- Added **Globe icon** indicator for published pages
- Added **URL display** with copy and open functionality for published pages
- Shows published status badge on cards

#### Public Landing Page Viewer
- Full-featured viewer component that renders published landing pages
- No authentication required
- Responsive design
- Supports all landing page sections (Hero, About, Speakers, Agenda, etc.)
- Includes form modal support for registration forms

### 5. Routing Updates
- Added public route `/p/:slug` for accessing published landing pages
- Route is accessible without authentication (similar to certificate viewing)
- Updated `App.tsx` to handle public landing page routes
- Updated `AppRoutes.tsx` with route configuration

## Usage

### Publishing a Landing Page
1. Navigate to Landing Pages manager
2. Click the **Publish** button on any saved landing page card
3. The page will be published and a public URL will be generated
4. The URL will be displayed on the card with copy and open options

### Accessing Published Pages
- Published pages are accessible at: `https://yourdomain.com/p/[slug]`
- The slug is automatically generated from the page title
- Pages can be shared publicly without requiring authentication

### Unpublishing
- Click the **Unpublish** button on a published page card
- The page will become private and the public URL will no longer work

## Database Migration

To apply the database changes, run the SQL script in your Supabase SQL Editor:

```sql
-- Run scripts/add-landing-page-publish-columns.sql
```

This will:
1. Add `is_published` and `public_slug` columns
2. Create indexes for performance
3. Add column comments for documentation

## Technical Details

### Slug Generation
- Slugs are generated from the page title (lowercase, hyphenated)
- Includes first 8 characters of page ID for uniqueness
- Automatically handles duplicate slugs by appending additional characters

### URL Format
- Published pages: `/p/[slug]`
- Example: `/p/my-conference-event-a1b2c3d4`

### Security
- Only published pages with `is_published = true` are accessible via public route
- Unpublished pages return 404 when accessed via slug
- Public viewer component validates page is published before rendering

## Files Modified/Created

### New Files
- `components/Admin/LPBuilder/Publisher/PublicLandingPageViewer.tsx`
- `components/Admin/LPBuilder/Publisher/index.ts`
- `scripts/add-landing-page-publish-columns.sql`
- `LANDING_PAGE_PUBLISHER_IMPLEMENTATION.md`

### Modified Files
- `services/landingPageService.ts` - Added publish/unpublish functions
- `components/Admin/LPBuilder/Manager/LandingPageManager.tsx` - Added publish UI
- `App.tsx` - Added public route handling
- `components/Admin/Layout/AppRoutes.tsx` - Added route configuration

## Testing Checklist

- [ ] Run database migration script
- [ ] Test publishing a landing page
- [ ] Verify public URL is generated correctly
- [ ] Test accessing published page without authentication
- [ ] Test copying URL from card
- [ ] Test opening URL in new tab
- [ ] Test unpublishing a page
- [ ] Verify unpublished pages are not accessible
- [ ] Test with multiple pages to ensure unique slugs
- [ ] Verify all landing page sections render correctly in public viewer
