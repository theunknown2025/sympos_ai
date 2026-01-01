import { FormSubmission, RegistrationForm } from '../types';

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

    // TODO: Implement actual email sending logic
    // This would typically use a service like SendGrid, AWS SES, or Firebase Extensions
    console.log('Would send email:', { to: email, subject, html });
    
    // For now, we'll just log it. In production, you would integrate with an email service
    // Example: await sendEmail({ to: email, subject, html });
    
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

    // TODO: Implement actual email sending logic
    // This would typically use a service like SendGrid, AWS SES, or Firebase Extensions
    console.log('Would send confirmation email:', { to: email, subject, html });
    
    // For now, we'll just log it. In production, you would integrate with an email service
    // Example: await sendEmail({ to: email, subject, html });
    
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw - we don't want email failures to break form submission
  }
};

/**
 * Send an invitation email to committee members
 */
export const sendInvitationEmail = async (
  recipients: Array<{ email: string; fullName: string }>,
  subject: string,
  content: string
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
    const formatEmailContent = (fullName: string, emailContent: string): string => {
      // Replace placeholders like {{name}} with actual name
      let personalizedContent = emailContent.replace(/\{\{name\}\}/g, fullName);
      personalizedContent = personalizedContent.replace(/\{\{fullName\}\}/g, fullName);
      
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
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is an automated email. Please do not reply.</p>
            </div>
          </body>
        </html>
      `;
    };

    // Get the email API URL from environment or use default
    const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001';
    
    // Send emails to all recipients using the Express email API
    const results = await Promise.allSettled(
      recipients.map(async (recipient) => {
        console.log(`Sending invitation email to ${recipient.email}...`);
        const html = formatEmailContent(recipient.fullName, content);
        
        try {
          // Call the Express email API endpoint
          const response = await fetch(`${EMAIL_API_URL}/api/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: recipient.email,
              subject,
              html,
              recipientName: recipient.fullName
            })
          });
          
          const data = await response.json();
          
          console.log('Email API response for', recipient.email, ':', { 
            status: response.status,
            success: data.success,
            hasError: !!data.error,
            messageId: data.messageId
          });

          // Check if request failed
          if (!response.ok) {
            const errorMsg = data.message || data.error || `HTTP ${response.status}: Failed to send email`;
            console.error('Server error response:', {
              status: response.status,
              statusText: response.statusText,
              data: data
            });
            throw new Error(errorMsg);
          }

          // Check if response contains an error
          if (data.error) {
            console.error('Server returned error:', data);
            throw new Error(data.message || data.error || 'Failed to send email');
          }
          
          // Verify success
          if (!data.success) {
            console.error('Server returned unsuccessful response:', data);
            throw new Error(data.message || 'Failed to send email');
          }

          return { success: true, email: recipient.email, data };
        } catch (err: any) {
          console.error(`Failed to send email to ${recipient.email}:`, err);
          console.error('Full error object:', JSON.stringify(err, null, 2));
          
          // Extract error message from various possible locations
          const errorMessage = err.message || 
                             err.error?.message || 
                             err.context?.body?.message ||
                             err.context?.body?.error ||
                             (err.error && typeof err.error === 'string' ? err.error : null) ||
                             String(err);
          const errorCode = err.status || 
                           err.statusCode || 
                           err.code ||
                           err.context?.statusCode;
          
          // If email API server is not running
          if (errorMessage.includes('fetch failed') || 
              errorMessage.includes('ECONNREFUSED') ||
              errorMessage.includes('Failed to fetch') ||
              errorCode === 'ECONNREFUSED') {
            const serverError = 'Email API server is not running. Please start it using: npm run email-server';
            console.error(serverError);
            return { 
              success: false, 
              email: recipient.email, 
              error: serverError 
            };
          }
          
          // If SMTP authentication failed
          if (errorMessage.includes('SMTP Authentication failed') ||
              errorMessage.includes('EAUTH') ||
              errorMessage.includes('Invalid SMTP credentials')) {
            return { 
              success: false, 
              email: recipient.email, 
              error: 'SMTP Authentication failed. Please check your SMTP_USER and SMTP_PASSWORD environment variables.' 
            };
          }
          
          // If email service not configured
          if (errorMessage.includes('Email service not configured') ||
              errorMessage.includes('SMTP credentials')) {
            return { 
              success: false, 
              email: recipient.email, 
              error: 'Email service not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.' 
            };
          }
          
          // Generic error
          return { 
            success: false, 
            email: recipient.email, 
            error: errorMessage || 'Failed to send email. Check console for details.' 
          };
        }
      })
    );

    // Check if any emails failed
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success));
    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value?.success);

    if (failed.length > 0 && succeeded.length === 0) {
      // Get the first error message for better debugging
      const firstError = failed.find(r => 
        r.status === 'fulfilled' && r.value?.error
      )?.value?.error || 
      failed.find(r => r.status === 'rejected')?.reason?.message ||
      'Unknown error';
      
      // Check if email API server is not running
      if (firstError.includes('not running') || 
          firstError.includes('ECONNREFUSED') ||
          firstError.includes('Failed to fetch')) {
        throw new Error(
          'Email API Server is not running.\n\n' +
          'Please start it using:\n\n' +
          'npm run email-server\n\n' +
          'Or run both servers together:\n' +
          'npm run dev:all'
        );
      }
      
      // Check if it's a configuration issue
      if (firstError.includes('not configured') || 
          firstError.includes('SMTP credentials')) {
        throw new Error(
          'Email service not configured.\n\n' +
          'The email API server is running, but SMTP credentials are missing.\n\n' +
          'Please check:\n' +
          '1. The email API server is running (check terminal for startup messages)\n' +
          '2. Your .env file is in the project root (same folder as package.json)\n' +
          '3. Your .env file contains:\n' +
          '   SMTP_HOST=smtp.hostinger.com\n' +
          '   SMTP_PORT=465\n' +
          '   SMTP_USER=your-email@yourdomain.com\n' +
          '   SMTP_PASSWORD=your-password\n' +
          '   FROM_EMAIL=your-email@yourdomain.com\n' +
          '   FROM_NAME=Sympos-ia Committee\n\n' +
          '4. Restart the email server after changing .env:\n' +
          '   npm run email-server\n\n' +
          'See START_EMAIL_SERVER.md for troubleshooting help.'
        );
      }
      
      // Check if it's an SMTP authentication issue
      if (firstError.includes('SMTP Authentication failed') ||
          firstError.includes('EAUTH') ||
          firstError.includes('Invalid SMTP credentials')) {
        throw new Error(
          'SMTP Authentication Failed\n\n' +
          'The email server is running, but SMTP credentials are incorrect.\n\n' +
          'Please verify:\n' +
          '1. SMTP_USER is your full email address\n' +
          '2. SMTP_PASSWORD is correct\n' +
          '3. Check your Hostinger webmail settings\n\n' +
          'After fixing, restart the email server:\n' +
          'npm run email-server'
        );
      }
      
      throw new Error(`Failed to send emails: ${firstError}`);
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

