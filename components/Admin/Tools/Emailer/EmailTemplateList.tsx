import React, { useState, useEffect } from 'react';
import {
  Edit2,
  Trash2,
  Calendar,
  Loader2,
  FileText,
  AlertCircle,
  Mail,
  Eye,
  X,
  File,
  Search,
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import {
  getUserEmailTemplates,
  deleteEmailTemplate,
} from '../../../../services/emailTemplateService';
import { EmailTemplate } from '../../../../types';

interface EmailTemplateListProps {
  onEdit: (templateId: string) => void;
  onNew: () => void;
  refreshTrigger?: number;
}

const EmailTemplateList: React.FC<EmailTemplateListProps> = ({ onEdit, onNew, refreshTrigger }) => {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadTemplates();
    }
  }, [currentUser, refreshTrigger]);

  const loadTemplates = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError('');
      const userTemplates = await getUserEmailTemplates(currentUser.id);
      setTemplates(userTemplates);
    } catch (err: any) {
      setError(err.message || 'Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string, templateTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${templateTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(templateId);
      await deleteEmailTemplate(templateId);
      setTemplates(templates.filter(t => t.id !== templateId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search templates by title or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Mail className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {searchQuery ? 'No templates found' : 'No email templates yet'}
          </h3>
          <p className="text-slate-500 mb-4">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first email template to get started'}
          </p>
          {!searchQuery && (
            <button
              onClick={onNew}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 truncate mb-1">
                    {template.title}
                  </h3>
                  <p className="text-sm text-slate-600 truncate">{template.subject}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    title="Preview"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onEdit(template.id)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id, template.title)}
                    disabled={deletingId === template.id}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === template.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Placeholders */}
              {template.placeholders && template.placeholders.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-1">Placeholders:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.placeholders.slice(0, 3).map((placeholder, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded"
                      >
                        {placeholder}
                      </span>
                    ))}
                    {template.placeholders.length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-slate-500">
                        +{template.placeholders.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {template.attachments && template.attachments.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <File size={12} />
                    <span>{template.attachments.length} attachment(s)</span>
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-1 text-xs text-slate-400 pt-3 border-t border-slate-200">
                <Calendar size={12} />
                <span>Updated {formatDate(template.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Template Preview</h2>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Title
                  </p>
                  <p className="text-sm text-slate-900">{previewTemplate.title}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Subject
                  </p>
                  <p className="text-sm text-slate-900">{previewTemplate.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Body
                  </p>
                  <div
                    className="text-sm text-slate-900 p-4 bg-slate-50 rounded-lg border border-slate-200 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: previewTemplate.body }}
                  />
                </div>
                {previewTemplate.placeholders && previewTemplate.placeholders.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                      Placeholders
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {previewTemplate.placeholders.map((placeholder, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded border border-indigo-200"
                        >
                          {placeholder}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {previewTemplate.attachments && previewTemplate.attachments.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                      Attachments
                    </p>
                    <div className="space-y-2">
                      {previewTemplate.attachments.map((attachment, idx) => {
                        const fileName = attachment.split('/').pop() || `Attachment ${idx + 1}`;
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200"
                          >
                            <File size={14} className="text-slate-400" />
                            <span className="text-xs text-slate-700 truncate">{fileName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateList;

