export const PARTICIPANT_LOGIN_MANDATORY_MARKER = 'HOW TO ACCESS YOUR ACCOUNT';

const LOGIN_URL = 'https://symposai.pro/login';

export function getParticipantLoginMandatoryPlain(
  recipientEmail?: string,
  password?: string
): string {
  const emailLabel = recipientEmail?.trim() || '{{email}}';
  const passwordLine = password
    ? `\nPassword: ${password}`
    : '\nPassword: (as provided in this email)';

  return `${PARTICIPANT_LOGIN_MANDATORY_MARKER}

Your participant account has been created and approved. Sign in at ${LOGIN_URL} using:

Email: ${emailLabel}${passwordLine}

After signing in, open the Invitations section from your dashboard to review and accept your invitation.

You cannot respond by replying to this email.`;
}

export function stripMandatoryParticipantSection(content: string): string {
  const idx = content.indexOf(PARTICIPANT_LOGIN_MANDATORY_MARKER);
  if (idx === -1) return content.trim();
  return content.slice(0, idx).trim();
}

export function buildFullParticipantInvitationBody(
  editableContent: string,
  recipientEmail?: string
): string {
  const editable = stripMandatoryParticipantSection(editableContent);
  const mandatory = getParticipantLoginMandatoryPlain(recipientEmail);
  if (!editable) return mandatory;
  return `${editable}\n\n---\n\n${mandatory}`;
}
export function buildParticipantInvitationEmailBody(
  editableContent: string,
  recipientEmail: string,
  password: string
): string {
  const editable = stripMandatoryParticipantSection(editableContent);
  const mandatory = getParticipantLoginMandatoryPlain(recipientEmail, password);
  if (!editable) return mandatory;
  return `${editable}\n\n---\n\n${mandatory}`;
}

export function getParticipantLoginMandatoryHtml(
  recipientEmail?: string,
  password?: string
): string {
  const emailLabel = recipientEmail?.trim() || '{{email}}';
  const escapedEmail = emailLabel
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const passwordHtml = password
    ? `<li style="margin: 4px 0;"><strong>Password:</strong> ${password.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`
    : '';

  return `
    <div style="margin-top: 28px; padding: 20px; background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px;">
      <p style="margin: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 13px; font-weight: 700; color: #3730a3; text-transform: uppercase; letter-spacing: 0.04em;">
        ${PARTICIPANT_LOGIN_MANDATORY_MARKER}
      </p>
      <p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">
        Your participant account has been created and approved. Sign in at
        <a href="${LOGIN_URL}" style="color: #4338ca; font-weight: 600;">symposai.pro/login</a>:
      </p>
      <ul style="margin: 0 0 10px 0; padding-left: 20px; font-family: Arial, sans-serif; font-size: 14px; color: #1e293b;">
        <li style="margin: 4px 0;"><strong>Email:</strong> ${escapedEmail}</li>
        ${passwordHtml}
      </ul>
      <p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">
        After signing in, open the <strong>Invitations</strong> section from your dashboard to review and accept your invitation.
      </p>
      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">
        <strong>You cannot respond by replying to this email.</strong>
      </p>
    </div>
  `;
}

export function formatParticipantInvitationHtml(
  editableContent: string,
  recipientEmail: string,
  password: string,
  attachments?: Array<{ name: string; url: string }>
): string {
  const mandatoryHtml = getParticipantLoginMandatoryHtml(recipientEmail, password);
  const editableHtml = editableContent.trim()
    ? `<div style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">${editableContent.trim().replace(/\n/g, '<br>')}</div>`
    : '';

  const attachmentsSection =
    attachments && attachments.length > 0
      ? `
        <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #334155;">Attachments</p>
          <ul style="margin: 0; padding-left: 20px;">
            ${attachments
              .map(
                (a) =>
                  `<li><a href="${a.url}" style="color: #4338ca;">${a.name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</a></li>`
              )
              .join('')}
          </ul>
        </div>`
      : '';

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
          ${editableHtml}
          ${mandatoryHtml}
          ${attachmentsSection}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">Automated message from Sympos AI.</p>
        </div>
      </body>
    </html>
  `;
}
