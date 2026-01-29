import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Paperclip,
  Send,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { getUserEmailTemplates, getEmailTemplate } from '../../../../services/emailTemplateService';
import { EmailTemplate } from '../../../../types';
import { sendInvitationEmail } from '../../../../services/emailService';
import { uploadFileToStorage } from '../../../../services/storageService';

export interface EmailRecipient {
  email: string;
  name?: string;
  [key: string]: any; // Allow custom data for placeholder replacement
}

interface EmailSenderProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: EmailRecipient[];
  onSuccess?: () => void;
  placeholderReplacer?: (template: string, recipient: EmailRecipient) => string;
  inline?: boolean; // If true, render without modal wrapper for inline use
  initialAttachments?: File[]; // Initial attachments to include
}

type EmailStatus = 'pending' | 'sending' | 'sent' | 'failed';

interface EmailProgress {
  email: string;
  name?: string;
  status: EmailStatus;
  error?: string;
}

const EmailSender: React.FC<EmailSenderProps> = ({
  isOpen,
  onClose,
  recipients,
  onSuccess,
  placeholderReplacer,
  inline = false,
  initialAttachments = [],
}) => {
  const { currentUser } = useAuth();
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [attachments, setAttachments] = useState<File[]>(initialAttachments);
  const [uploadedAttachmentUrls, setUploadedAttachmentUrls] = useState<Array<{ name: string; url: string }>>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailProgress, setEmailProgress] = useState<Map<string, EmailProgress>>(new Map());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  // Initialize email progress map
  useEffect(() => {
    if (isOpen && recipients.length > 0) {
      const progressMap = new Map<string, EmailProgress>();
      recipients.forEach(recipient => {
        progressMap.set(recipient.email, {
          email: recipient.email,
          name: recipient.name,
          status: 'pending',
        });
      });
      setEmailProgress(progressMap);
      setSentCount(0);
      setFailedCount(0);
      setSuccess(false);
      setError('');
    }
  }, [isOpen, recipients]);

  // Update attachments when initialAttachments change
  useEffect(() => {
    if (isOpen && initialAttachments.length > 0) {
      setAttachments(initialAttachments);
    }
  }, [isOpen, initialAttachments]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const replacePlaceholders = (template: string, recipient: EmailRecipient): string => {
    if (placeholderReplacer) {
      return placeholderReplacer(template, recipient);
    }

    // Default placeholder replacement
    let content = template;
    
    // Replace common placeholders
    content = content.replace(/\{\{name\}\}/g, recipient.name || recipient.email.split('@')[0]);
    content = content.replace(/\{\{fullName\}\}/g, recipient.name || recipient.email.split('@')[0]);
    content = content.replace(/\{\{email\}\}/g, recipient.email);
    
    // Replace any custom placeholders from recipient data
    Object.keys(recipient).forEach(key => {
      if (key !== 'email' && key !== 'name') {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        content = content.replace(placeholder, String(recipient[key] || ''));
      }
    });

    return content;
  };

  const getPreviewContent = (): string => {
    if (!selectedTemplate) return '';
    if (recipients.length === 0) return selectedTemplate.body;
    
    // Use first recipient for preview
    return replacePlaceholders(selectedTemplate.body, recipients[0]);
  };

  const getPreviewSubject = (): string => {
    if (!selectedTemplate) return '';
    if (recipients.length === 0) return selectedTemplate.subject;
    
    // Use first recipient for preview
    return replacePlaceholders(selectedTemplate.subject, recipients[0]);
  };

  // Upload attachments to storage bucket
  const uploadAttachments = async (): Promise<Array<{ name: string; url: string }>> => {
    if (attachments.length === 0 || !currentUser?.id) {
      return [];
    }

    setUploadingAttachments(true);
    const uploadedFiles: Array<{ name: string; url: string }> = [];

    try {
      for (const file of attachments) {
        const url = await uploadFileToStorage(currentUser.id, file, 'email-attachments');
        uploadedFiles.push({ name: file.name, url });
      }
      setUploadedAttachmentUrls(uploadedFiles);
      return uploadedFiles;
    } catch (error: any) {
      console.error('Error uploading attachments:', error);
      throw new Error(`Failed to upload attachments: ${error.message}`);
    } finally {
      setUploadingAttachments(false);
    }
  };

  const sendEmails = async () => {
    if (!selectedTemplate) {
      setError('Please select an email template');
      return;
    }

    if (recipients.length === 0) {
      setError('No recipients specified');
      return;
    }

    if (!currentUser?.id) {
      setError('User not authenticated');
      return;
    }

    setSending(true);
    setError('');
    setSuccess(false);
    setSentCount(0);
    setFailedCount(0);

    // Upload attachments first
    let attachmentUrls: Array<{ name: string; url: string }> = [];
    if (attachments.length > 0) {
      try {
        attachmentUrls = await uploadAttachments();
      } catch (err: any) {
        setError(err.message || 'Failed to upload attachments');
        setSending(false);
        return;
      }
    }

    // Reset all progress to pending
    const progressMap = new Map<string, EmailProgress>();
    recipients.forEach(recipient => {
      progressMap.set(recipient.email, {
        email: recipient.email,
        name: recipient.name,
        status: 'pending',
      });
    });
    setEmailProgress(progressMap);

    // Send emails one by one
    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      try {
        // Update status to sending
        setEmailProgress(prev => {
          const newMap = new Map(prev);
          newMap.set(recipient.email, {
            email: recipient.email,
            name: recipient.name,
            status: 'sending',
          });
          return newMap;
        });

        // Prepare email content
        const subject = replacePlaceholders(selectedTemplate.subject, recipient);
        const body = replacePlaceholders(selectedTemplate.body, recipient);

        // Send email with attachments
        await sendInvitationEmail(
          [{ email: recipient.email, fullName: recipient.name || recipient.email }],
          subject,
          body,
          attachmentUrls
        );

        // Update status to sent
        setEmailProgress(prev => {
          const newMap = new Map(prev);
          newMap.set(recipient.email, {
            email: recipient.email,
            name: recipient.name,
            status: 'sent',
          });
          return newMap;
        });

        successCount++;
        setSentCount(successCount);
      } catch (err: any) {
        // Update status to failed
        setEmailProgress(prev => {
          const newMap = new Map(prev);
          newMap.set(recipient.email, {
            email: recipient.email,
            name: recipient.name,
            status: 'failed',
            error: err.message || 'Failed to send email',
          });
          return newMap;
        });

        failCount++;
        setFailedCount(failCount);
        console.error(`Failed to send email to ${recipient.email}:`, err);
      }
    }

    setSending(false);
    
    if (failCount === 0) {
      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } else if (successCount > 0) {
      setError(`${successCount} email(s) sent successfully, ${failCount} failed.`);
    } else {
      setError('All emails failed to send. Please check your email configuration.');
    }
  };

  const handleClose = () => {
    if (sending) return; // Prevent closing while sending
    
    setSelectedTemplateId('');
    setSelectedTemplate(null);
    setAttachments([]);
    setUploadedAttachmentUrls([]);
    setPreviewMode(false);
    setEmailProgress(new Map());
    setError('');
    setSuccess(false);
    setSentCount(0);
    setFailedCount(0);
    onClose();
  };

  if (!isOpen) return null;

  const content = (
    <div className={`${inline ? 'w-full' : 'bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4'} ${inline ? 'max-h-[60vh]' : 'max-h-[90vh]'} flex flex-col`}>
      {/* Header - only show if not inline */}
      {!inline && (
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Send Emails</h2>
            <p className="text-sm text-slate-600 mt-1">
              {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={sending}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={24} />
          </button>
        </div>
      )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
              <CheckCircle2 size={20} />
              <span>All emails sent successfully!</span>
            </div>
          )}

          {/* Email Template Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Template
            </label>
            {loadingTemplates ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="animate-spin" size={16} />
                <span>Loading templates...</span>
              </div>
            ) : emailTemplates.length === 0 ? (
              <p className="text-sm text-slate-500">No email templates found. Please create one first.</p>
            ) : (
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                disabled={sending || loadingTemplate}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select a template...</option>
                {emailTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Template Preview</h3>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {previewMode ? (
                    <>
                      <EyeOff size={16} />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye size={16} />
                      Show Preview
                    </>
                  )}
                </button>
              </div>
              
              {previewMode && (
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Subject:</p>
                    <p className="text-sm text-slate-900 font-medium">{getPreviewSubject()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Content:</p>
                    <div 
                      className="text-sm text-slate-900 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: getPreviewContent().replace(/\n/g, '<br>') }}
                    />
                  </div>
                  {attachments.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Attachments:</p>
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-slate-700">
                            <Paperclip size={14} className="text-slate-400" />
                            <span>{file.name}</span>
                            <span className="text-xs text-slate-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Attachments (Optional)
            </label>
            <div className="space-y-2">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                disabled={sending || uploadingAttachments}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {uploadingAttachments && (
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Uploading attachments...</span>
                </div>
              )}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Paperclip size={16} className="text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-700 truncate">{file.name}</span>
                        <span className="text-xs text-slate-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        disabled={sending}
                        className="p-1 text-red-600 hover:text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recipients List */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Recipients ({recipients.length})
            </label>
            <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
              <div className="divide-y divide-slate-200">
                {recipients.map((recipient, index) => {
                  const progress = emailProgress.get(recipient.email);
                  const status = progress?.status || 'pending';
                  
                  return (
                    <div
                      key={index}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-slate-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-900 truncate">
                            {recipient.name || recipient.email}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 ml-6 truncate">{recipient.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {status === 'pending' && (
                          <span className="text-xs text-slate-500">Pending</span>
                        )}
                        {status === 'sending' && (
                          <div className="flex items-center gap-2 text-indigo-600">
                            <Loader2 className="animate-spin" size={14} />
                            <span className="text-xs">Sending...</span>
                          </div>
                        )}
                        {status === 'sent' && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 size={14} />
                            <span className="text-xs">Sent</span>
                          </div>
                        )}
                        {status === 'failed' && (
                          <div className="flex items-center gap-2 text-red-600" title={progress?.error}>
                            <AlertCircle size={14} />
                            <span className="text-xs">Failed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {sending ? (
              <span>
                Sending... {sentCount + failedCount} / {recipients.length}
              </span>
            ) : (
              <span>
                {sentCount > 0 && (
                  <span className="text-green-600 font-medium">{sentCount} sent</span>
                )}
                {sentCount > 0 && failedCount > 0 && <span className="mx-2">•</span>}
                {failedCount > 0 && (
                  <span className="text-red-600 font-medium">{failedCount} failed</span>
                )}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={sending}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Cancel'}
            </button>
            <button
              onClick={sendEmails}
              disabled={!selectedTemplate || sending || uploadingAttachments || recipients.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Emails
                </>
              )}
            </button>
          </div>
        </div>
      </div>
  );

  // If inline, return just the content without modal wrapper
  if (inline) {
    return content;
  }

  // Otherwise, return with modal wrapper
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {content}
    </div>
  );
};

export default EmailSender;
