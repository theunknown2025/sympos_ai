# Event Publish Status Implementation

## Overview
This implementation adds a publish status feature to events, allowing organizers to control whether events are visible to participants.

## Changes Made

### 1. Database Migration
**File:** `scripts/add-publish-status-to-events.sql`

- Added `publish_status` column to the `events` table
- Default value: `'Draft'`
- Constraint: Only allows `'Draft'`, `'Published'`, or `'Closed'`
- All existing events are set to `'Draft'` by default

### 2. Type Definitions
**File:** `types.ts`

- Added `PublishStatus` type: `'Draft' | 'Published' | 'Closed'`
- Added `publishStatus?: PublishStatus` to the `Event` interface

### 3. Event Service Updates
**File:** `services/eventService.ts`

- Updated `saveEvent()` to set default `publishStatus` to `'Draft'` for new events
- Updated `updateEvent()` to handle `publishStatus` updates
- Updated `getEvent()` and `getUserEvents()` to include `publishStatus` in returned data
- Added new function `updateEventPublishStatus()` for updating publish status

### 4. Publish Handler Component
**File:** `components/Admin/EventManagement/PublishHandler.tsx`

A modal component that handles publish status changes:
- **Draft events**: Shows option to publish
- **Published events**: Shows options to unpublish (Draft) or close (Closed)
- **Closed events**: Shows options to reopen as Published or Draft

### 5. List of Events Updates
**File:** `components/Admin/EventManagement/ListOfEvents.tsx`

- Added publish button (Send icon) next to Preview, Edit, and Delete buttons
- Button color changes based on status:
  - Draft: Gray
  - Published: Green
  - Closed: Orange
- Added status badge showing current publish status
- Integrated `PublishHandler` modal

## How to Apply

### Step 1: Run Database Migration

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to: **SQL Editor** → **New Query**
3. Copy and paste the contents of `scripts/add-publish-status-to-events.sql`
4. Click **Run** to execute the migration

### Step 2: Verify Migration

Run this query to verify the column was added:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'publish_status';
```

### Step 3: Test the Feature

1. Navigate to Event Management in your admin panel
2. You should see a publish button (Send icon) next to each event
3. Click the button to test:
   - Draft events → Click to publish
   - Published events → Click to see options (Unpublish/Close)
   - Closed events → Click to see options (Reopen as Published/Draft)

## Usage

### For Draft Events (Unpublished)
- Click the publish button
- Confirm to publish the event
- Event becomes visible to participants

### For Published Events
- Click the publish button
- Choose one of:
  - **Unpublish**: Changes status to Draft (event hidden from participants)
  - **Close**: Changes status to Closed (event is closed)

### For Closed Events
- Click the publish button
- Choose one of:
  - **Reopen as Published**: Makes event visible to participants again
  - **Reopen as Draft**: Reopens but keeps it hidden from participants

## Status Meanings

- **Draft**: Event is not visible to participants. Use this for events still being prepared.
- **Published**: Event is visible to participants. They can see and interact with it.
- **Closed**: Event is closed. Use this when the event has ended or registration is closed.

## Next Steps

To filter events by publish status for participants:
1. Update participant-facing event queries to filter by `publishStatus = 'Published'`
2. Consider adding a filter in the admin panel to view events by status
3. Add visual indicators in participant views for closed events
