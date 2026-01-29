# Emailer Tool

A tool for creating and managing email templates with placeholders and attachments.

## Features

- Create email templates with dynamic placeholders (e.g., `{{name}}`, `{{email}}`, `{{event_name}}`)
- Support for HTML email bodies
- File attachments (PDF, DOC, DOCX, images, etc.)
- Template preview
- Search and filter templates
- Edit and delete templates

## Setup

### 1. Database Table

The `email_templates` table has been created in Supabase with the following structure:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `title` (TEXT, required)
- `subject` (TEXT, required)
- `body` (TEXT, required) - HTML or plain text
- `placeholders` (TEXT, JSON array) - Available placeholders
- `attachments` (TEXT, JSON array) - Attachment file URLs
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 2. Storage Bucket

**IMPORTANT:** You need to create the storage bucket manually:

1. Go to your Supabase Dashboard
2. Navigate to Storage
3. Create a new bucket named: `email-templates`
4. Set it to **Public** if you want public URLs, or **Private** if you want signed URLs
5. Configure RLS policies as needed

### 3. RLS Policies

The table has RLS enabled with policies that allow users to:
- View their own templates
- Insert their own templates
- Update their own templates
- Delete their own templates

## Usage

### Common Placeholders

The tool includes these common placeholders:
- `{{name}}` - Participant name
- `{{email}}` - Participant email
- `{{phone}}` - Participant phone
- `{{organization}}` - Organization name
- `{{event_name}}` - Event name
- `{{event_date}}` - Event date
- `{{event_location}}` - Event location
- `{{submission_title}}` - Submission title
- `{{submission_status}}` - Submission status

You can also create custom placeholders.

## File Structure

```
components/Admin/Tools/Emailer/
├── Emailer.tsx              # Main component with tabs
├── NewEmailTemplate.tsx     # Create/Edit template form
├── EmailTemplateList.tsx    # List of templates with search
├── EditEmailTemplate.tsx    # Re-exports NewEmailTemplate
└── index.ts                 # Export file
```

## Service

The `emailTemplateService.ts` provides:
- `saveEmailTemplate()` - Create new template
- `updateEmailTemplate()` - Update existing template
- `getEmailTemplate()` - Get single template
- `getUserEmailTemplates()` - Get all user templates
- `deleteEmailTemplate()` - Delete template and attachments
- `uploadEmailTemplateAttachment()` - Upload file attachment
- `deleteEmailTemplateAttachment()` - Delete file attachment

