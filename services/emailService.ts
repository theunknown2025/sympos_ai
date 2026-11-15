import { FormSubmission, RegistrationForm } from '../types';
import {
  getMandatoryInvitationResponseSectionHtml,
  stripMandatoryInvitationSection,
} from './committeeInvitationEmailMandatory';
import { sendTransactionalEmail } from './emailTransport';

/**
 * Email service for sending form-related emails
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Format form answers for email display
 */
const formatAnswersForEmail = (form: RegistrationForm, submission: FormSubmission): string => {
  let html = '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">';
  
  // General Information
  if (submission.generalInfo) {
    html += '<h3 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; margin-top: 20px;">General Information</h3>';
    html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">';
    
    if (submission.generalInfo.name) {
      html += `<tr><td style="padding: 8px; font-weight: bold; width: 150px;">Name:</td><td style="padding: 8px;">${submission.generalInfo.name}</td></tr>`;
    }
    if (submission.generalInfo.email) {
      html += `<tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${submission.generalInfo.email}</td></tr>`;
    }
    if (submission.generalInfo.phone) {
      html += `<tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${submission.generalInfo.phone}</td></tr>`;
    }
    if (submission.generalInfo.organization) {
      html += `<tr><td style="padding: 8px; font-weight: bold;">Organization:</td><td style="padding: 8px;">${submission.generalInfo.organization}</td></tr>`;
    }
    if (submission.generalInfo.address) {
      html += `<tr><td style="padding: 8px; font-weight: bold;">Address:</td><td style="padding: 8px;">${submission.generalInfo.address}</td></tr>`;
    }
    
    html += '</table>';
  }

  // Form Answers
  const getAllFields = (): any[] => {
    const fields: any[] = [];
    form.fields.forEach(f => fields.push(f));
    form.sections.forEach(section => {
      section.fields.forEach(f => fields.push(f));
      section.subsections.forEach(subsection => {
        subsection.fields.forEach(f => fields.push(f));
      });
    });
    return fields;
  };

  const allFields = getAllFields();
  const fieldsWithAnswers = allFields.filter(field => submission.answers[field.id] !== undefined);

  if (fieldsWithAnswers.length > 0) {
    html += '<h3 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; margin-top: 20px;">Form Answers</h3>';
    html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">';

    fieldsWithAnswers.forEach(field => {
      const value = submission.answers[field.id];
      let displayValue = '';

      // Handle sub-fields (array of objects)
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        displayValue = '<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">';
        displayValue += '<thead><tr style="background-color: #f3f4f6;">';
        
        if (field.subFields) {
          field.subFields.forEach((subField: any) => {
            displayValue += `<th style="padding: 8px; text-align: left; border: 1px solid #ddd;">${subField.label}</th>`;
          });
        } else {
          Object.keys(value[0]).forEach(key => {
            displayValue += `<th style="padding: 8px; text-align: left; border: 1px solid #ddd;">${key}</th>`;
          });
        }
        
        displayValue += '</tr></thead><tbody>';
        value.forEach((row: any, index: number) => {
          displayValue += '<tr>';
          if (field.subFields) {
            field.subFields.forEach((subField: any) => {
              displayValue += `<td style="padding: 8px; border: 1px solid #ddd;">${row[subField.id] || 'N/A'}</td>`;
            });
          } else {
            Object.values(row).forEach((val: any) => {
              displayValue += `<td style="padding: 8px; border: 1px solid #ddd;">${val || 'N/A'}</td>`;
            });
          }
          displayValue += '</tr>';
        });
        displayValue += '</tbody></table>';
      } else if (Array.isArray(value)) {
        // Multiple simple answers
        displayValue = '<ul style="margin: 0; padding-left: 20px;">';
        value.forEach((val: any) => {
          if (val !== null && val !== undefined && val !== '') {
            displayValue += `<li style="margin: 4px 0;">${String(val)}</li>`;
          }
        });
        displayValue += '</ul>';
      } else {
        displayValue = String(value || 'N/A');
      }

      html += `<tr>
        <td style="padding: 8px; font-weight: bold; width: 200px; vertical-align: top;">${field.label}:</td>
        <td style="padding: 8px; vertical-align: top;">${displayValue}</td>
      </tr>`;
    });

    html += '</table>';
  }

  html += '</div>';
  return html;
};

/**
 * Send a copy of form answers to the submitter
 */
export const sendCopyOfAnswers = async (
  form: RegistrationForm,
  submission: FormSubmission
): Promise<void> => {
  try {
    const email = submission.generalInfo?.email;
    if (!email) {
      console.warn('No email address provided, cannot send copy of answers');
      return;
    }

    const subject = `Copy of Your ${form.title} Submission`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">Thank You for Your Submission</h2>
            <p style="color: #6b7280;">This is a copy of your form submission for <strong>${form.title}</strong>.</p>
            <p style="color: #6b7280; font-size: 12px; margin-bottom: 20px;">Submitted on: ${new Date(submission.submittedAt).toLocaleString()}</p>
            ${formatAnswersForEmail(form, submission)}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is an automated email. Please do not reply.</p>
          </div>
        </body>
      </html>
    `;

    await sendTransactionalEmail({ to: email, subject, html });
    
  } catch (error) {
    console.error('Error sending copy of answers:', error);
    // Don't throw - we don't want email failures to break form submission
  }
};

/**
 * Send a confirmation email to the submitter
 */
export const sendConfirmationEmail = async (
  form: RegistrationForm,
  submission: FormSubmission
): Promise<void> => {
  try {
    const email = submission.generalInfo?.email;
    if (!email) {
      console.warn('No email address provided, cannot send confirmation email');
      return;
    }

    const subject = `Confirmation: ${form.title} Submission Received`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">Submission Confirmed</h2>
            <p style="color: #4b5563; font-size: 16px;">Thank you for submitting <strong>${form.title}</strong>!</p>
            <p style="color: #6b7280;">We have successfully received your submission and will review it shortly.</p>
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>Submission Details:</strong><br>
                Form: ${form.title}<br>
                Submitted on: ${new Date(submission.submittedAt).toLocaleString()}
              </p>
            </div>
            ${form.description ? `<p style="color: #6b7280;">${form.description}</p>` : ''}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is an automated confirmation email. Please do not reply.</p>
          </div>
        </body>
      </html>
    `;

    await sendTransactionalEmail({ to: email, subject, html });
    
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw - we don't want email failures to break form submission
  }
};

/**
 * Send an invitation email to committee members
 */
export interface SendInvitationEmailOptions {
  /** Appends the fixed “log in and use Invitations” block (committee invitations only). */
  includeCommitteeInvitationMandatoryFooter?: boolean;
}

export const sendInvitationEmail = async (
  recipients: Array<{ email: string; fullName: string }>,
  subject: string,
  content: string,
  attachments?: Array<{ name: string; url: string }>,
  options?: SendInvitationEmailOptions
): Promise<void> => {
  try {
    if (recipients.length === 0) {
      throw new Error('No recipients specified');
    }

    if (!subject.trim()) {
      throw new Error('Email subject is required');
    }

    if (!content.trim()) {
      throw new Error('Email content is required');
    }

    // Format email content with recipient personalization
    const includeMandatoryFooter = options?.includeCommitteeInvitationMandatoryFooter === true;

    const formatEmailContent = (
      fullName: string,
      emailContent: string,
      email: string,
      emailAttachments?: Array<{ name: string; url: string }>
    ): string => {
      const editableOnly = includeMandatoryFooter
        ? stripMandatoryInvitationSection(emailContent)
        : emailContent;

      let personalizedContent = editableOnly.replace(/\{\{name\}\}/g, fullName);
      personalizedContent = personalizedContent.replace(/\{\{fullName\}\}/g, fullName);
      personalizedContent = personalizedContent.replace(/\{\{email\}\}/g, email);

      const mandatoryFooterHtml = includeMandatoryFooter
        ? getMandatoryInvitationResponseSectionHtml(email)
        : '';
      
      const escapeHtml = (text: string) =>
        text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');

      // Download links (files stay on storage — safer than MIME attachments for size/spam)
      let attachmentsSection = '';
      if (emailAttachments && emailAttachments.length > 0) {
        attachmentsSection = `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
            <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 12px 0; font-family: Arial, sans-serif;">Documents</h3>
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 14px 0; font-family: Arial, sans-serif;">
              The following files are included with this invitation. You can also access them from the Invitations page after you log in.
            </p>
            <ul style="margin: 0; padding: 0; list-style: none; font-family: Arial, sans-serif;">
              ${emailAttachments
                .map((attachment) => {
                  const safeUrl = escapeHtml(attachment.url);
                  const safeName = escapeHtml(attachment.name);
                  return `
                <li style="margin: 0 0 10px 0;">
                  <a href="${safeUrl}" style="color: #2563eb; text-decoration: underline; font-size: 14px; font-weight: 500;" target="_blank" rel="noopener noreferrer">
                    Download — ${safeName}
                  </a>
                </li>`;
                })
                .join('')}
            </ul>
          </div>
        `;
      }
      
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 20px; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                ${personalizedContent.replace(/\n/g, '<br>')}
              </div>
              ${mandatoryFooterHtml}
              ${attachmentsSection}
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is an automated email. Please do not reply.</p>
            </div>
          </body>
        </html>
      `;
    };

    const results = await Promise.allSettled(
      recipients.map(async (recipient) => {
        const html = formatEmailContent(recipient.fullName, content, recipient.email, attachments);

        try {
          const data = await sendTransactionalEmail({
            to: recipient.email,
            subject,
            html,
            recipientName: recipient.fullName,
          });
          return { success: true, email: recipient.email, data };
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
          console.error(`Failed to send email to ${recipient.email}:`, errorMessage);
          return {
            success: false,
            email: recipient.email,
            error: errorMessage,
          };
        }
      })
    );

    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success));
    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value?.success);

    if (failed.length > 0 && succeeded.length === 0) {
      const firstError = failed.find(r =>
        r.status === 'fulfilled' && r.value?.error
      )?.value?.error ||
      failed.find(r => r.status === 'rejected')?.reason?.message ||
      'Unknown error';
      throw new Error(firstError);
    }

    if (failed.length > 0) {
      const errorMessages = failed
        .map(r => r.status === 'fulfilled' ? r.value?.error : r.reason?.message)
        .filter(Boolean)
        .join('; ');
      console.warn(`${failed.length} email(s) failed to send, ${succeeded.length} succeeded. Errors: ${errorMessages}`);
    }

    console.log(`Successfully sent ${succeeded.length} out of ${recipients.length} invitation email(s)`);
    
  } catch (error) {
    console.error('Error sending invitation emails:', error);
    throw error; // Re-throw so the UI can handle the error
  }
};

