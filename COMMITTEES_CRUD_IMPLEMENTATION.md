# Committees CRUD Implementation

## Overview

Full CRUD (Create, Read, Update, Delete) functionality has been implemented for committees management.

## What Was Implemented

### 1. Database Schema ✅

**File:** `scripts/create-committees-table.sql`

Created the `committees` table with:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `name` (TEXT, required)
- `description` (TEXT, optional)
- `fields_of_intervention` (TEXT, JSON string)
- `created_at` and `updated_at` timestamps
- Row Level Security (RLS) policies
- Update trigger for `updated_at`

### 2. Type Definitions ✅

**File:** `types.ts`

Added:
- `FieldOfIntervention` interface
- `Committee` interface

### 3. Service Layer ✅

**File:** `services/committeeService.ts`

Implemented all CRUD operations:
- `saveCommittee()` - Create new committee
- `updateCommittee()` - Update existing committee
- `getCommittees()` - Get all committees for a user
- `getCommittee()` - Get single committee by ID
- `deleteCommittee()` - Delete a committee

### 4. Components Updated ✅

#### `CommitteesList.tsx`
- ✅ Fetches committees from database
- ✅ Displays committees with details
- ✅ Shows member count per committee
- ✅ Shows fields of intervention
- ✅ Edit button (opens edit form)
- ✅ Delete button with confirmation
- ✅ Loading and error states
- ✅ Empty state handling

#### `NewCommittee.tsx`
- ✅ Creates new committees
- ✅ Edits existing committees
- ✅ Validates form data
- ✅ Saves to database via service
- ✅ Success/error feedback
- ✅ Form reset after creation
- ✅ Supports both create and edit modes

#### `Dashboard.tsx`
- ✅ Handles committee editing state
- ✅ Passes edit handler to CommitteesList
- ✅ Manages tab navigation
- ✅ Handles success callbacks

## Database Setup

Before using committees, you need to create the table in Supabase:

1. **Option 1: Run the standalone script**
   ```sql
   -- Run scripts/create-committees-table.sql in Supabase SQL Editor
   ```

2. **Option 2: Run the main setup script**
   ```sql
   -- Run scripts/setup-supabase-tables.sql (includes committees table)
   ```

## Usage

### Creating a Committee

1. Navigate to **Manage Committee** → **Committees** tab
2. Click **"New Committee"** sub-tab
3. Fill in:
   - Committee name (required)
   - Description (optional)
   - Add fields of intervention
   - Assign members to each field
4. Click **"Create Committee"**

### Editing a Committee

1. Go to **"Liste Committees"** sub-tab
2. Click the **Edit** button (pencil icon) on a committee
3. Modify the details
4. Click **"Update Committee"**

### Deleting a Committee

1. Go to **"Liste Committees"** sub-tab
2. Click the **Delete** button (trash icon) on a committee
3. Confirm deletion in the dialog

### Viewing Committees

- All committees are listed in the **"Liste Committees"** tab
- Each committee shows:
  - Name and description
  - Number of fields of intervention
  - Total member count (across all fields)
  - Creation date
  - List of fields with member counts

## Data Structure

### Committee
```typescript
{
  id: string;
  userId: string;
  name: string;
  description?: string;
  fieldsOfIntervention: FieldOfIntervention[];
  createdAt: Date;
  updatedAt: Date;
}
```

### FieldOfIntervention
```typescript
{
  id: string;
  name: string;
  memberIds: string[]; // Array of ReviewCommitteeMember IDs
}
```

## Features

✅ **Create** - Full form with validation  
✅ **Read** - List all committees with details  
✅ **Update** - Edit existing committees  
✅ **Delete** - Remove committees with confirmation  
✅ **Error Handling** - Comprehensive error messages  
✅ **Loading States** - Loading indicators during operations  
✅ **Success Feedback** - Success messages after operations  
✅ **Data Validation** - Form validation before submission  
✅ **User Isolation** - RLS ensures users only see their own committees  

## Next Steps

To use committees in your application:

1. **Run the SQL migration** in Supabase:
   - Go to SQL Editor
   - Run `scripts/create-committees-table.sql` or `scripts/setup-supabase-tables.sql`

2. **Test the functionality**:
   - Create a committee
   - Add fields of intervention
   - Assign members to fields
   - Edit a committee
   - Delete a committee

3. **Integrate with submissions** (if needed):
   - Link committees to submissions
   - Assign submissions to committee members
   - Track review progress

## Files Modified

- ✅ `types.ts` - Added Committee and FieldOfIntervention types
- ✅ `supabase.ts` - Added COMMITTEES to TABLES constant
- ✅ `services/committeeService.ts` - Created (new file)
- ✅ `components/Admin/Submissions/ManageCommittee/CommitteesList.tsx` - Updated
- ✅ `components/Admin/Submissions/ManageCommittee/NewCommittee.tsx` - Updated
- ✅ `components/Admin/Submissions/ManageCommittee/Dashboard.tsx` - Updated
- ✅ `scripts/create-committees-table.sql` - Created (new file)
- ✅ `scripts/setup-supabase-tables.sql` - Updated

## Testing Checklist

- [ ] Create a new committee
- [ ] Add fields of intervention
- [ ] Assign members to fields
- [ ] View committee list
- [ ] Edit a committee
- [ ] Delete a committee
- [ ] Verify data persists after page refresh
- [ ] Test error handling (e.g., duplicate names)
- [ ] Verify user isolation (only see own committees)

