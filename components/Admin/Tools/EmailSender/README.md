# EmailSender Component

A reusable email sending component that provides a complete email sending interface with template selection, attachment support, recipient management, and real-time progress tracking.

## Features

- ✅ **Email Template Selection** - Select from saved email templates
- ✅ **Template Preview** - Preview subject and content with placeholder replacement
- ✅ **Attachment Support** - Upload and attach documents/files
- ✅ **Recipient List** - View all recipients before sending
- ✅ **One-by-One Sending** - Sends emails sequentially with progress tracking
- ✅ **Real-Time Progress** - See status for each email (pending, sending, sent, failed)
- ✅ **Placeholder Replacement** - Automatic replacement of placeholders like `{{name}}`, `{{email}}`, etc.
- ✅ **Custom Placeholder Support** - Use custom placeholder replacer function

## Usage

### Basic Example

```tsx
import { useState } from 'react';
import EmailSender, { EmailRecipient } from './components/Admin/Tools/EmailSender';

function MyComponent() {
  const [showEmailSender, setShowEmailSender] = useState(false);
  
  const recipients: EmailRecipient[] = [
    { email: 'user1@example.com', name: 'John Doe' },
    { email: 'user2@example.com', name: 'Jane Smith' },
  ];

  return (
    <>
      <button onClick={() => setShowEmailSender(true)}>
        Send Emails
      </button>
      
      <EmailSender
        isOpen={showEmailSender}
        onClose={() => setShowEmailSender(false)}
        recipients={recipients}
        onSuccess={() => {
          console.log('All emails sent successfully!');
        }}
      />
    </>
  );
}
```

### With Custom Placeholder Replacement

```tsx
const recipients: EmailRecipient[] = [
  { 
    email: 'user@example.com', 
    name: 'John Doe',
    eventName: 'Tech Conference 2024',
    registrationDate: '2024-01-15'
  },
];

<EmailSender
  isOpen={showEmailSender}
  onClose={() => setShowEmailSender(false)}
  recipients={recipients}
  placeholderReplacer={(template, recipient) => {
    let content = template;
    
    // Replace standard placeholders
    content = content.replace(/\{\{name\}\}/g, recipient.name || '');
    content = content.replace(/\{\{email\}\}/g, recipient.email);
    
    // Replace custom placeholders
    content = content.replace(/\{\{eventName\}\}/g, recipient.eventName || '');
    content = content.replace(/\{\{registrationDate\}\}/g, recipient.registrationDate || '');
    
    return content;
  }}
  onSuccess={() => {
    // Handle success
  }}
/>
```

### From Registrations View

```tsx
import EmailSender, { EmailRecipient } from '../Tools/EmailSender';

function RegistrationsView() {
  const [showEmailSender, setShowEmailSender] = useState(false);
  const [selectedRegistrations, setSelectedRegistrations] = useState<FormSubmission[]>([]);

  const handleSendEmails = () => {
    // Convert registrations to recipients
    const recipients: EmailRecipient[] = selectedRegistrations.map(submission => ({
      email: submission.generalInfo?.email || submission.submittedBy || '',
      name: submission.generalInfo?.name || submission.submittedBy,
      submissionId: submission.id,
      eventTitle: submission.eventTitle,
      // Add any other data you want to use in placeholders
    }));
    
    setShowEmailSender(true);
  };

  return (
    <>
      <button onClick={handleSendEmails}>
        Send Emails to Selected
      </button>
      
      <EmailSender
        isOpen={showEmailSender}
        onClose={() => setShowEmailSender(false)}
        recipients={recipients}
        placeholderReplacer={(template, recipient) => {
          let content = template;
          content = content.replace(/\{\{name\}\}/g, recipient.name || '');
          content = content.replace(/\{\{email\}\}/g, recipient.email);
          content = content.replace(/\{\{eventTitle\}\}/g, recipient.eventTitle || '');
          return content;
        }}
        onSuccess={() => {
          // Refresh registrations or show success message
        }}
      />
    </>
  );
}
```

## Props

### EmailSenderProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Callback when modal is closed |
| `recipients` | `EmailRecipient[]` | Yes | Array of email recipients |
| `onSuccess` | `() => void` | No | Callback when all emails are sent successfully |
| `placeholderReplacer` | `(template: string, recipient: EmailRecipient) => string` | No | Custom function to replace placeholders in template |

### EmailRecipient

```typescript
interface EmailRecipient {
  email: string;        // Required: recipient email address
  name?: string;       // Optional: recipient name
  [key: string]: any;  // Any additional data for placeholder replacement
}
```

## Email Template Placeholders

The component automatically replaces these placeholders:

- `{{name}}` - Recipient name
- `{{fullName}}` - Recipient full name (same as name)
- `{{email}}` - Recipient email

You can add custom placeholders by:
1. Including the data in the `EmailRecipient` object
2. Using a custom `placeholderReplacer` function

## Email Sending Process

1. **Select Template** - User selects an email template
2. **Preview** - User can preview the email with placeholders replaced
3. **Add Attachments** (Optional) - User can upload files to attach
4. **Review Recipients** - User sees the list of all recipients
5. **Send** - Emails are sent one by one with progress tracking
6. **Progress Display** - Each email shows status: pending → sending → sent/failed

## Status Types

- `pending` - Email is queued but not sent yet
- `sending` - Email is currently being sent
- `sent` - Email was sent successfully
- `failed` - Email failed to send (error message available on hover)

## Notes

- **Attachments**: Currently, attachments are collected in the UI but need to be implemented in the email API. The component is ready for this feature.
- **Error Handling**: Failed emails are tracked and displayed, but the sending process continues for remaining emails.
- **Template Loading**: Templates are loaded from the user's saved email templates.
- **Email API**: Uses the existing `sendInvitationEmail` service which calls the Express email API.

## Future Enhancements

- [ ] Implement attachment sending in email API
- [ ] Add email scheduling
- [ ] Add email templates preview with multiple recipients
- [ ] Add bulk operations (select/deselect recipients)
- [ ] Add email history/logging
