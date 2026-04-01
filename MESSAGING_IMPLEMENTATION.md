# Messaging System Implementation

## Overview
A comprehensive messaging system has been implemented that allows admins to create groups and send messages to participants, and allows participants to view and respond to messages.

## Features Implemented

### Admin Features
1. **Create Message Groups**
   - Name and describe groups
   - Add members from:
     - Committee members
     - Registration participants
     - Submission participants
   - Search and select participants with visual indicators
   - Edit and delete groups

2. **Send Messages**
   - Send messages to groups
   - Include text content and optional subject
   - Attach multiple documents/files
   - View message history in groups

3. **Manage Groups**
   - View all groups with member counts
   - Add/remove members from groups
   - Edit group details

### Participant Features
1. **View Messages**
   - See all messages sent to them (direct or via groups)
   - Unread message indicators
   - Message list with preview
   - Read/unread status tracking

2. **Respond to Messages**
   - Reply to messages with text
   - Attach documents/files to replies
   - View message threads
   - Download attachments

## Database Schema

The following tables were created:

1. **message_groups** - Stores group information
2. **message_group_members** - Links participants to groups
3. **messages** - Stores all messages
4. **message_attachments** - Stores file attachments
5. **message_read_status** - Tracks read/unread status

See `scripts/create-messaging-tables.sql` for the complete schema.

## Files Created/Modified

### New Files
- `scripts/create-messaging-tables.sql` - Database schema
- `services/messagingService.ts` - Messaging service functions
- `components/Admin/Messaging/Messaging.tsx` - Admin messaging interface
- `components/Participant/Messaging/Messaging.tsx` - Participant messaging interface

### Modified Files
- `types.ts` - Added messaging types and ViewState enum values
- `supabase.ts` - Added messaging table names and storage bucket
- `routes.tsx` - Added messaging routes
- `components/Admin/Layout/Sidebar.tsx` - Added Messaging menu item
- `components/Admin/Layout/AppRoutes.tsx` - Added messaging routes
- `App.tsx` - Added auto-expand for participant messaging

## Setup Instructions

1. **Run Database Migration**
   ```sql
   -- Execute the SQL script in Supabase SQL Editor
   -- File: scripts/create-messaging-tables.sql
   ```

2. **Create Storage Bucket**
   - Go to Supabase Storage
   - Create a bucket named `message-attachments`
   - Set it to public or configure appropriate policies

3. **Access the Feature**
   - **Admin**: Navigate to "Messaging" in the sidebar
   - **Participant**: Navigate to "Participant" > "Messages" in the sidebar

## Usage

### Admin: Creating a Group and Sending Messages

1. Click "Messaging" in the sidebar
2. Click the "+" button to create a new group
3. Enter group name and description
4. Click "Add Members" to add participants
5. Search and select participants from committees, registrations, or submissions
6. Click "Add" to add selected participants
7. Select the group to view messages
8. Type a message (optional subject)
9. Attach files if needed
10. Click "Send"

### Participant: Viewing and Responding

1. Click "Participant" > "Messages" in the sidebar
2. Click on a message to view details
3. Download attachments if any
4. Click "Reply" to respond
5. Type your reply and attach files if needed
6. Click "Send Reply"

## Technical Details

### Message Flow
- Admin creates group → Adds members → Sends message to group
- Message is stored with group_id
- All group members can see the message
- Participants can reply (reply is linked to original message)
- Read status is tracked per recipient

### Security
- Row Level Security (RLS) policies are in place
- Admins can only see their own groups
- Participants can only see messages sent to them
- File uploads are stored in Supabase Storage

### Storage
- Message attachments are stored in `message-attachments` bucket
- Files are organized by message ID
- Public URLs are generated for downloads

## Future Enhancements

Potential improvements:
- Real-time notifications
- Email notifications for new messages
- Message search functionality
- Message forwarding
- Group message threads view
- Unread message count badge
- Message templates
