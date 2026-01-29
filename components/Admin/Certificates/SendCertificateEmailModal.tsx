import React, { useState, useEffect } from 'react';
import { X, Mail, Loader2, AlertCircle, CheckCircle2, Eye, Send } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getUserEmailTemplates, getEmailTemplate } from '../../../services/emailTemplateService';
import { EmailTemplate, CertificateTemplate, FormSubmission } from '../../../types';
import { sendInvitationEmail } from '../../../services/emailService';
import { getCertificateTemplate } from '../../../services/certificateTemplateService';
import { saveCertificate } from '../../../services/certificateService';
import { getParticipantProfile } from '../../../services/participantProfileService';
import { supabase, STORAGE_BUCKETS } from '../../../supabase';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

interface SendCertificateEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: FormSubmission[];
  selectedParticipantIds: Set<string>;
  eventId: string;
  templateId: string;
  eventTitle?: string;
}

const SendCertificateEmailModal: React.FC<SendCertificateEmailModalProps> = ({
  isOpen,
  onClose,
  participants,
  selectedParticipantIds,
  eventId,
  templateId,
  eventTitle,
}) => {
  const { currentUser } = useAuth();
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [emailSource, setEmailSource] = useState<'account' | 'registration'>('account');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [accountEmails, setAccountEmails] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (isOpen && currentUser) {
      loadEmailTemplates();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (selectedTemplateId && currentUser) {
      loadTemplate(selectedTemplateId);
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedTemplateId, currentUser]);

  const loadEmailTemplates = async () => {
    if (!currentUser?.id) return;
    try {
      setLoadingTemplates(true);
      setError('');
      const templates = await getUserEmailTemplates(currentUser.id);
      setEmailTemplates(templates);
      if (templates.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(templates[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load email templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadTemplate = async (templateId: string) => {
    try {
      setLoadingTemplate(true);
      const template = await getEmailTemplate(templateId);
      setSelectedTemplate(template);
    } catch (err: any) {
      setError(err.message || 'Failed to load template');
    } finally {
      setLoadingTemplate(false);
    }
  };

  const getParticipantName = (submission: FormSubmission): string => {
    return submission.generalInfo?.name || 
           submission.submittedBy || 
           submission.answers['general_name'] as string || 
           'Participant';
  };

  const getParticipantEmail = (submission: FormSubmission, source: 'account' | 'registration' = emailSource): string => {
    if (source === 'account') {
      // Get email from participant account/profile
      if (submission.participantUserId && accountEmails.has(submission.participantUserId)) {
        return accountEmails.get(submission.participantUserId) || '';
      }
      // If not loaded yet, return empty (will be loaded)
      return '';
    } else {
      // Get email from registration form
      return submission.generalInfo?.email || 
             submission.answers['general_email'] as string || 
             '';
    }
  };

  // Load account emails for participants
  useEffect(() => {
    if (isOpen && emailSource === 'account') {
      loadAccountEmails();
    }
  }, [isOpen, emailSource, participants, selectedParticipantIds]);

  const loadAccountEmails = async () => {
    // Load emails for all participants (for preview) and selected participants (for sending)
    const allSubmissions = participants;
    const userIds = new Set<string>();
    
    // Add all participant user IDs
    allSubmissions.forEach(s => {
      if (s.participantUserId) {
        userIds.add(s.participantUserId);
      }
    });
    
    const emailMap = new Map<string, string>();
    
    for (const userId of userIds) {
      try {
        const profile = await getParticipantProfile(userId);
        if (profile?.email) {
          emailMap.set(userId, profile.email);
        }
      } catch (err) {
        console.error(`Error loading profile for user ${userId}:`, err);
      }
    }
    
    setAccountEmails(emailMap);
  };

  const getFieldValue = (submission: FormSubmission, fieldName: string, source: 'account' | 'registration' = emailSource): string => {
    if (fieldName === 'name') {
      return getParticipantName(submission);
    }
    if (fieldName === 'email') {
      return getParticipantEmail(submission, source);
    }
    if (fieldName === 'organization') {
      return submission.generalInfo?.organization || submission.answers['general_organization'] as string || '';
    }
    if (fieldName === 'phone') {
      return submission.generalInfo?.phone || submission.answers['general_phone'] as string || '';
    }
    if (fieldName === 'address') {
      return submission.generalInfo?.address || submission.answers['general_address'] as string || '';
    }
    return submission.answers[fieldName] as string || '';
  };

  const generateQRCodeDataURL = async (url: string, size: number): Promise<string> => {
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return dataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  const generateCertificateImage = async (
    template: CertificateTemplate,
    submission: FormSubmission,
    certificateUrl?: string
  ): Promise<string> => {
    const container = document.createElement('div');
    container.style.width = `${template.width}px`;
    container.style.height = `${template.height}px`;
    container.style.position = 'relative';
    container.style.backgroundColor = '#ffffff';
    container.style.overflow = 'hidden';
    
    if (template.backgroundImage) {
      const bgImg = document.createElement('img');
      bgImg.src = template.backgroundImage;
      bgImg.style.position = 'absolute';
      bgImg.style.top = '0';
      bgImg.style.left = '0';
      bgImg.style.width = '100%';
      bgImg.style.height = '100%';
      bgImg.style.objectFit = 'cover';
      bgImg.crossOrigin = 'anonymous';
      container.appendChild(bgImg);
      
      if (!template.backgroundImage.startsWith('data:')) {
        await new Promise((resolve) => {
          bgImg.onload = resolve;
          bgImg.onerror = () => resolve(null);
          setTimeout(() => resolve(null), 5000);
        });
      }
    }
    
    for (const element of template.elements) {
      const elementDiv = document.createElement('div');
      elementDiv.style.position = 'absolute';
      elementDiv.style.left = `${element.x}%`;
      elementDiv.style.top = `${element.y}%`;
      elementDiv.style.transform = 'translate(-50%, -50%)';
      elementDiv.style.zIndex = '10';
      
      if (element.type === 'qr') {
        if (certificateUrl) {
          try {
            const qrSize = element.fontSize;
            const qrDataUrl = await generateQRCodeDataURL(certificateUrl, qrSize);
            const qrImg = document.createElement('img');
            qrImg.src = qrDataUrl;
            qrImg.style.width = `${qrSize}px`;
            qrImg.style.height = `${qrSize}px`;
            qrImg.style.display = 'block';
            elementDiv.appendChild(qrImg);
          } catch (error) {
            console.error('Error generating QR code:', error);
            elementDiv.style.width = `${element.fontSize}px`;
            elementDiv.style.height = `${element.fontSize}px`;
            elementDiv.style.backgroundColor = '#f3f4f6';
            elementDiv.style.border = '2px dashed #9ca3af';
            elementDiv.textContent = 'QR';
          }
        } else {
          elementDiv.style.width = `${element.fontSize}px`;
          elementDiv.style.height = `${element.fontSize}px`;
          elementDiv.style.backgroundColor = '#f3f4f6';
          elementDiv.style.border = '2px dashed #9ca3af';
          elementDiv.textContent = 'QR';
        }
      } else {
        elementDiv.style.fontSize = `${element.fontSize}px`;
        elementDiv.style.fontFamily = element.fontFamily;
        elementDiv.style.fontWeight = element.fontWeight;
        elementDiv.style.color = element.color;
        elementDiv.style.textAlign = element.textAlign;
        elementDiv.style.whiteSpace = 'nowrap';
        
        let content = element.content;
        if (element.type === 'field') {
          content = getFieldValue(submission, element.content);
        }
        elementDiv.textContent = content;
      }
      
      container.appendChild(elementDiv);
    }

    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const canvas = await html2canvas(container, {
        width: template.width,
        height: template.height,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imageData = canvas.toDataURL('image/png', 1.0);
      document.body.removeChild(container);
      return imageData;
    } catch (error) {
      document.body.removeChild(container);
      console.error('Error generating certificate:', error);
      throw new Error('Failed to generate certificate');
    }
  };

  const replacePlaceholders = (text: string, submission: FormSubmission, certificateUrl?: string, source: 'account' | 'registration' = emailSource): string => {
    let result = text;
    
    // Replace common placeholders
    result = result.replace(/\{\{name\}\}/g, getParticipantName(submission));
    result = result.replace(/\{\{email\}\}/g, getParticipantEmail(submission, source));
    result = result.replace(/\{\{phone\}\}/g, submission.generalInfo?.phone || submission.answers['general_phone'] as string || '');
    result = result.replace(/\{\{organization\}\}/g, submission.generalInfo?.organization || submission.answers['general_organization'] as string || '');
    result = result.replace(/\{\{event_name\}\}/g, eventTitle || 'Event');
    result = result.replace(/\{\{event_date\}\}/g, '');
    result = result.replace(/\{\{event_location\}\}/g, '');
    result = result.replace(/\{\{certificate_url\}\}/g, certificateUrl || '');
    
    // Replace any other custom placeholders from submission answers
    Object.keys(submission.answers).forEach(key => {
      const value = submission.answers[key];
      if (value !== null && value !== undefined) {
        const placeholder = `{{${key}}}`;
        result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
      }
    });
    
    return result;
  };

  const getPreviewContent = (submission: FormSubmission, source: 'account' | 'registration' = emailSource): { subject: string; body: string } => {
    if (!selectedTemplate) {
      return { subject: '', body: '' };
    }

    const subject = replacePlaceholders(selectedTemplate.subject, submission, undefined, source);
    const body = replacePlaceholders(selectedTemplate.body, submission, undefined, source);
    
    return { subject, body };
  };

  const handleSend = async () => {
    if (!selectedTemplate) {
      setError('Please select an email template');
      return;
    }

    const selectedSubmissions = participants.filter(p => selectedParticipantIds.has(p.id));
    
    // Load account emails if needed
    if (emailSource === 'account') {
      await loadAccountEmails();
    }
    
    const validSubmissions = selectedSubmissions.filter(s => {
      const email = getParticipantEmail(s, emailSource);
      return email && email.trim() !== '';
    });

    if (validSubmissions.length === 0) {
      setError('No participants with valid email addresses selected');
      return;
    }

    try {
      setSending(true);
      setError('');
      setSuccess(false);
      setSentCount(0);

      // Load certificate template
      const certTemplate = await getCertificateTemplate(templateId);
      if (!certTemplate) {
        throw new Error('Certificate template not found');
      }

      const hasQRCodes = certTemplate.elements.some(el => el.type === 'qr');
      const emailResults: Array<{ success: boolean; email: string; error?: string }> = [];

      // Process each participant
      for (let i = 0; i < validSubmissions.length; i++) {
        const submission = validSubmissions[i];
        const participantEmail = getParticipantEmail(submission, emailSource);
        const participantName = getParticipantName(submission);
        
        try {
          let certificateUrl: string | undefined;
          let certificateImageData: string;

          if (hasQRCodes) {
            // Step 1: Generate temp certificate to upload and get storage URL
            const tempImageData = await generateCertificateImage(certTemplate, submission);
            
            // Step 2: Upload to get storage URL
            const imageBlob = await fetch(tempImageData).then(r => r.blob());
            const file = new File([imageBlob], `certificate-${Date.now()}.png`, { type: 'image/png' });
            const fileName = `${currentUser!.id}/certificates/${Date.now()}-${Math.random().toString(36).substring(2)}.png`;
            
            let uploadData: any;
            let bucketId: string;
            
            try {
              bucketId = STORAGE_BUCKETS.MEDIA;
              const result = await supabase.storage.from(bucketId).upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });
              uploadData = result.data;
              if (result.error) throw result.error;
            } catch (err) {
              bucketId = STORAGE_BUCKETS.GENERAL;
              const result = await supabase.storage.from(bucketId).upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });
              uploadData = result.data;
              if (result.error) throw result.error;
            }
            
            const { data: urlData } = supabase.storage.from(bucketId).getPublicUrl(uploadData.path);
            certificateUrl = urlData.publicUrl;
            
            // Step 3: Generate final certificate with QR code
            certificateImageData = await generateCertificateImage(certTemplate, submission, certificateUrl);
            
            // Step 4: Update uploaded image with final version
            const finalBlob = await fetch(certificateImageData).then(r => r.blob());
            const finalFile = new File([finalBlob], `certificate-${Date.now()}.png`, { type: 'image/png' });
            await supabase.storage.from(bucketId).update(uploadData.path, finalFile, {
              cacheControl: '3600',
              upsert: true
            });
            
            // Step 5: Save certificate record
            const certificateId = crypto.randomUUID();
            await supabase.from('certificates').insert({
              id: certificateId,
              user_id: currentUser!.id,
              event_id: eventId,
              template_id: templateId,
              participant_submission_id: submission.id,
              certificate_image_url: certificateUrl,
              certificate_url: `${window.location.origin}/certificate/${certificateId}`,
              participant_name: participantName,
              participant_email: participantEmail,
              created_at: new Date().toISOString(),
            });
          } else {
            // No QR codes, generate and save directly
            certificateImageData = await generateCertificateImage(certTemplate, submission);
            const savedCert = await saveCertificate(
              currentUser!.id,
              eventId,
              templateId,
              submission.id,
              certificateImageData,
              participantName,
              participantEmail
            );
            certificateUrl = savedCert.certificateImageUrl;
          }

          // Step 6: Send email with certificate
          const subject = replacePlaceholders(selectedTemplate.subject, submission, certificateUrl, emailSource);
          const body = replacePlaceholders(selectedTemplate.body, submission, certificateUrl, emailSource);
          
          // Format as HTML
          const html = body.includes('<') ? body : `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 20px; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; white-space: pre-wrap;">
                    ${body.replace(/\n/g, '<br>')}
                  </div>
                  ${certificateUrl ? `
                    <div style="margin-top: 20px; text-align: center;">
                      <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Your certificate:</p>
                      <a href="${certificateUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">View Certificate</a>
                    </div>
                  ` : ''}
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">This is an automated email. Please do not reply.</p>
                </div>
              </body>
            </html>
          `;

          // Send email using the email service
          await sendInvitationEmail(
            [{ email: participantEmail, fullName: participantName }],
            subject,
            body
          );

          emailResults.push({ success: true, email: participantEmail });
          setSentCount(i + 1);
        } catch (err: any) {
          console.error(`Error processing certificate for ${participantEmail}:`, err);
          emailResults.push({ 
            success: false, 
            email: participantEmail, 
            error: err.message || 'Failed to process certificate' 
          });
        }
      }

      const successful = emailResults.filter(r => r.success).length;
      
      if (successful === validSubmissions.length) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        const failed = emailResults.filter(r => !r.success);
        setError(`Failed to send ${failed.length} out of ${validSubmissions.length} emails. Check console for details.`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send emails');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const selectedSubmissions = participants.filter(p => selectedParticipantIds.has(p.id));
  const previewSubmission = selectedSubmissions[0] || participants[0];
  const preview = previewSubmission ? getPreviewContent(previewSubmission, emailSource) : { subject: '', body: '' };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="text-indigo-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Send Certificates by Email</h2>
              <p className="text-sm text-slate-500">
                {selectedParticipantIds.size} participant{selectedParticipantIds.size !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 size={16} />
              <span>Certificates sent successfully!</span>
            </div>
          )}

          {/* Email Template Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Email Template <span className="text-red-500">*</span>
            </label>
            {loadingTemplates ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Loading templates...</span>
              </div>
            ) : emailTemplates.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="text-sm text-slate-600 mb-2">No email templates found</p>
                <p className="text-xs text-slate-500">Create an email template first in the Emailer tool</p>
              </div>
            ) : (
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {emailTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Preview */}
          {selectedTemplate && !loadingTemplate && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Email Preview</h3>
                <div className="flex items-center gap-3">
                  {/* Email Source Selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-600">Email Source:</label>
                    <select
                      value={emailSource}
                      onChange={(e) => setEmailSource(e.target.value as 'account' | 'registration')}
                      className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="account">Account</option>
                      <option value="registration">Registration</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                    {previewMode ? 'Hide Preview' : 'Show Preview'}
                  </button>
                </div>
              </div>

              {/* Email Display */}
              {previewSubmission && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs font-medium text-slate-500 mb-1">Recipient Email:</p>
                  <p className="text-sm text-slate-900 font-medium">
                    {getParticipantEmail(previewSubmission, emailSource) || (
                      <span className="text-slate-400 italic">
                        {emailSource === 'account' 
                          ? 'No account email found' 
                          : 'No registration email found'}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {previewMode && (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="mb-3">
                    <p className="text-xs font-medium text-slate-500 mb-1">Subject:</p>
                    <p className="text-sm text-slate-900 font-medium">{preview.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Body:</p>
                    <div
                      className="text-sm text-slate-900 p-4 bg-white rounded border border-slate-200"
                      dangerouslySetInnerHTML={{ __html: preview.body }}
                    />
                  </div>
                </div>
              )}

              {/* Placeholders Info */}
              {selectedTemplate.placeholders && selectedTemplate.placeholders.length > 0 && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-xs font-medium text-indigo-900 mb-2">Available Placeholders:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.placeholders.map((placeholder, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-white text-indigo-700 rounded border border-indigo-300"
                      >
                        {placeholder}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedTemplate || sending || selectedParticipantIds.size === 0}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Sending... ({sentCount}/{selectedParticipantIds.size})
              </>
            ) : (
              <>
                <Send size={18} />
                Send {selectedParticipantIds.size} Email{selectedParticipantIds.size !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendCertificateEmailModal;
