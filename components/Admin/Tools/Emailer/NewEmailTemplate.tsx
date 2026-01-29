import React, { useState, useEffect } from 'react';
import { Save, X, Loader2, AlertCircle, Plus, Trash2, File, Upload } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  saveEmailTemplate,
  updateEmailTemplate,
  getEmailTemplate,
  uploadEmailTemplateAttachment,
  deleteEmailTemplateAttachment,
} from '../../../../services/emailTemplateService';
import { EmailTemplate } from '../../../../types';

interface NewEmailTemplateProps {
  templateId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

const NewEmailTemplate: React.FC<NewEmailTemplateProps> = ({ templateId, onSave, onCancel }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [newPlaceholder, setNewPlaceholder] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!templateId);
  const [error, setError] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Common placeholders that users might want to use
  const commonPlaceholders = [
    '{{name}}',
    '{{email}}',
    '{{phone}}',
    '{{organization}}',
    '{{event_name}}',
    '{{event_date}}',
    '{{event_location}}',
    '{{submission_title}}',
    '{{submission_status}}',
  ];

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadTemplate = async (id: string) => {
    try {
      setIsLoading(true);
      const template = await getEmailTemplate(id);
      if (template) {
        setTitle(template.title);
        setSubject(template.subject);
        setBody(template.body);
        setPlaceholders(template.placeholders || []);
        setAttachments(template.attachments || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlaceholder = () => {
    if (newPlaceholder.trim() && !placeholders.includes(newPlaceholder.trim())) {
      setPlaceholders([...placeholders, newPlaceholder.trim()]);
      setNewPlaceholder('');
    }
  };

  const handleRemovePlaceholder = (placeholder: string) => {
    setPlaceholders(placeholders.filter(p => p !== placeholder));
  };

  const handleAddCommonPlaceholder = (placeholder: string) => {
    if (!placeholders.includes(placeholder)) {
      setPlaceholders([...placeholders, placeholder]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;

    try {
      setUploadingFile(true);
      setError('');
      const fileUrl = await uploadEmailTemplateAttachment(currentUser.id, file);
      setAttachments([...attachments, fileUrl]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = async (attachmentUrl: string) => {
    try {
      await deleteEmailTemplateAttachment(attachmentUrl);
      setAttachments(attachments.filter(a => a !== attachmentUrl));
    } catch (err: any) {
      setError(err.message || 'Failed to remove attachment');
    }
  };

  const handleInsertPlaceholder = (placeholder: string) => {
    const textarea = document.getElementById('email-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, start) + placeholder + text.substring(end);
      setBody(newText);
      // Move cursor after inserted placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Template title is required');
      return;
    }
    
    if (!subject.trim()) {
      setError('Email subject is required');
      return;
    }
    
    if (!body.trim()) {
      setError('Email body is required');
      return;
    }
    
    if (!currentUser?.id) {
      setError('User not authenticated');
      return;
    }
    
    try {
      setIsSaving(true);
      setError('');
      
      const templateData: Omit<EmailTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        subject: subject.trim(),
        body: body.trim(),
        placeholders: placeholders.length > 0 ? placeholders : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      };
      
      if (templateId) {
        await updateEmailTemplate(templateId, templateData);
      } else {
        await saveEmailTemplate(currentUser.id, templateData);
      }
      
      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
            Template Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Welcome Email, Submission Confirmation"
            required
          />
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
            Email Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Welcome to {{event_name}}"
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            You can use placeholders like {commonPlaceholders.slice(0, 3).join(', ')} in the subject
          </p>
        </div>

        {/* Placeholders */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Available Placeholders
          </label>
          <div className="space-y-3">
            {/* Common Placeholders */}
            <div>
              <p className="text-xs text-slate-500 mb-2">Common Placeholders:</p>
              <div className="flex flex-wrap gap-2">
                {commonPlaceholders.map(placeholder => (
                  <button
                    key={placeholder}
                    type="button"
                    onClick={() => handleAddCommonPlaceholder(placeholder)}
                    className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                      placeholders.includes(placeholder)
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {placeholder}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Placeholders */}
            <div>
              <p className="text-xs text-slate-500 mb-2">Custom Placeholders:</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPlaceholder}
                  onChange={(e) => setNewPlaceholder(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPlaceholder();
                    }
                  }}
                  placeholder="e.g., {{custom_field}}"
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddPlaceholder}
                  className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {placeholders.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {placeholders.map(placeholder => (
                    <div
                      key={placeholder}
                      className="flex items-center gap-1 px-3 py-1 bg-indigo-50 border border-indigo-300 text-indigo-700 rounded-lg text-xs"
                    >
                      <span>{placeholder}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePlaceholder(placeholder)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div>
          <label htmlFor="email-body" className="block text-sm font-medium text-slate-700 mb-2">
            Email Body <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Click on a placeholder above to insert it into the body
              </p>
              <div className="flex gap-2">
                {placeholders.slice(0, 5).map(placeholder => (
                  <button
                    key={placeholder}
                    type="button"
                    onClick={() => handleInsertPlaceholder(placeholder)}
                    className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                  >
                    {placeholder}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={15}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              placeholder="Dear {{name}},\n\nWelcome to {{event_name}}..."
              required
            />
            <p className="text-xs text-slate-500">
              Supports HTML. Use placeholders like {commonPlaceholders[0]} for dynamic content.
            </p>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Attachments
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
                <Upload size={16} />
                <span>Upload File</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
              </label>
              {uploadingFile && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment, index) => {
                  const fileName = attachment.split('/').pop() || `Attachment ${index + 1}`;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <File size={16} className="text-slate-400" />
                        <span className="text-sm text-slate-700 truncate max-w-md">{fileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(attachment)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                {templateId ? 'Update Template' : 'Save Template'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewEmailTemplate;

