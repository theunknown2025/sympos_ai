/** Marker used to avoid duplicating the mandatory block when resending or re-saving. */
export const MANDATORY_INVITATION_SECTION_MARKER = 'HOW TO RESPOND TO THIS INVITATION';

const MANDATORY_BODY = `To respond to this invitation, you must log in to our website using the same email address this invitation was sent to ({{email}}).

Open the "Invitations" section from your dashboard or the sidebar menu to read the full message, view any attachments, and accept or decline.

You cannot respond by replying to this email.`;

/**
 * Plain-text mandatory footer appended to every committee invitation email and in-app display.
 */
export function getMandatoryInvitationResponseSectionPlain(recipientEmail?: string): string {
  const emailLabel = recipientEmail?.trim() || 'your invited email address';
  const body = MANDATORY_BODY.replace(/\{\{email\}\}/g, emailLabel);
  return `${MANDATORY_INVITATION_SECTION_MARKER}\n\n${body}`;
}

export function invitationContentIncludesMandatorySection(content: string): boolean {
  return content.includes(MANDATORY_INVITATION_SECTION_MARKER);
}

/**
 * Returns organizer-editable content only (strips a previously appended mandatory block).
 */
export function stripMandatoryInvitationSection(content: string): string {
  const idx = content.indexOf(MANDATORY_INVITATION_SECTION_MARKER);
  if (idx === -1) return content.trim();
  return content.slice(0, idx).trim();
}

/**
 * Full message shown to participants and sent in SMTP emails.
 */
export function buildFullInvitationEmailBody(
  editableContent: string,
  recipientEmail?: string
): string {
  const editable = stripMandatoryInvitationSection(editableContent);
  const mandatory = getMandatoryInvitationResponseSectionPlain(recipientEmail);
  if (!editable) return mandatory;
  return `${editable}\n\n---\n\n${mandatory}`;
}

export function getMandatoryInvitationResponseSectionHtml(recipientEmail?: string): string {
  const emailLabel = recipientEmail?.trim() || 'your invited email address';
  const escapedEmail = emailLabel
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `
    <div style="margin-top: 28px; padding: 20px; background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px;">
      <p style="margin: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 13px; font-weight: 700; color: #3730a3; text-transform: uppercase; letter-spacing: 0.04em;">
        ${MANDATORY_INVITATION_SECTION_MARKER}
      </p>
      <p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">
        To respond to this invitation, you must log in to our website using the same email address this invitation was sent to (<strong>${escapedEmail}</strong>).
      </p>
      <p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">
        Open the <strong>Invitations</strong> section from your dashboard or the sidebar menu to read the full message, view any attachments, and accept or decline.
      </p>
      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">
        <strong>You cannot respond by replying to this email.</strong>
      </p>
    </div>
  `;
}
