import React, { useState, useEffect } from 'react';
import { CertificateTemplate } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { getUserCertificateTemplates, deleteCertificateTemplate } from '../../../services/certificateTemplateService';
import { getUserBadgeTemplates, deleteBadgeTemplate } from '../../../services/badgeTemplateService';
import { FileText, Edit, Eye, Trash2, Loader2, Plus, Award, Badge as BadgeIcon } from 'lucide-react';
import CertificateTemplateBuilder from './CertificateTemplateBuilder';

// Extended template type with type information
interface TemplateWithType extends CertificateTemplate {
  templateType: 'certificate' | 'badge';
}

interface CertificateTemplateListProps {
  templateId?: string;
  onEdit?: (templateId: string) => void;
  onNew?: () => void;
  onSave?: () => void;
}

const CertificateTemplateList: React.FC<CertificateTemplateListProps> = ({ 
  templateId, 
  onEdit, 
  onNew, 
  onSave 
}) => {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState<TemplateWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('list');
  const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>(templateId);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'certificate' | 'badge'>('all');

  useEffect(() => {
    if (currentUser) {
      loadTemplates(currentUser.id);
    } else {
      setLoading(false);
      setTemplates([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (templateId) {
      setEditingTemplateId(templateId);
      setActiveTab('new');
    }
  }, [templateId]);

  // Note: We don't auto-reload on tab switch to avoid infinite loops
  // Templates are reloaded on initial mount and after save

  const loadTemplates = async (userId: string) => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch both certificate and badge templates
      const [certificateTemplates, badgeTemplates] = await Promise.all([
        getUserCertificateTemplates(userId),
        getUserBadgeTemplates(userId)
      ]);
      
      // Combine and mark with type
      const allTemplates: TemplateWithType[] = [
        ...certificateTemplates.map(t => ({ ...t, templateType: 'certificate' as const })),
        ...badgeTemplates.map(t => ({ ...t, templateType: 'badge' as const }))
      ];
      
      // Sort by updated date (most recent first)
      allTemplates.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      
      setTemplates(allTemplates);
    } catch (err: any) {
      setError('Failed to load templates. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: 'certificate' | 'badge') => {
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }
    try {
      setDeletingId(id);
      
      // Delete from appropriate table based on type
      if (type === 'badge') {
        await deleteBadgeTemplate(id);
      } else {
        await deleteCertificateTemplate(id);
      }
      
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err: any) {
      setError('Failed to delete template. Please try again.');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id: string) => {
    setEditingTemplateId(id);
    setActiveTab('new');
    if (onEdit) onEdit(id);
  };

  const handleNew = () => {
    setEditingTemplateId(undefined);
    setActiveTab('new');
    if (onNew) onNew();
  };

  const handleSave = () => {
    if (currentUser) {
      loadTemplates(currentUser.id);
    }
    setActiveTab('list');
    if (onSave) onSave();
  };

  if (activeTab === 'new') {
    return (
      <CertificateTemplateBuilder
        templateId={editingTemplateId}
        onSave={handleSave}
        onBack={() => {
          setActiveTab('list');
          setEditingTemplateId(undefined);
        }}
      />
    );
  }

  // Filter templates based on selected filter
  const filteredTemplates = filterType === 'all' 
    ? templates 
    : templates.filter(t => t.templateType === filterType);

  return (
    <div className="h-full flex flex-col p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Certificate & Badge Templates</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your certificate and badge templates</p>
      </header>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('new')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'new'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          New Template
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'list'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          List of Templates
        </button>
      </div>

      {/* Filter buttons */}
      {activeTab === 'list' && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({templates.length})
          </button>
          <button
            onClick={() => setFilterType('certificate')}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              filterType === 'certificate'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Award size={16} />
            Certificates ({templates.filter(t => t.templateType === 'certificate').length})
          </button>
          <button
            onClick={() => setFilterType('badge')}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              filterType === 'badge'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BadgeIcon size={16} />
            Badges ({templates.filter(t => t.templateType === 'badge').length})
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-slate-500 mt-4">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-200">
          <FileText className="text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {templates.length === 0 ? 'No templates yet' : `No ${filterType} templates`}
          </h3>
          <p className="text-slate-500 mb-4">
            {templates.length === 0 ? 'Create your first template' : `Create a ${filterType} template`}
          </p>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} />
            New Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                <img
                  src={template.backgroundImage}
                  alt={template.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f1f5f9" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-family="Arial" font-size="18"%3EImage not found%3C/text%3E%3C/svg%3E';
                  }}
                />
                {/* Type Badge */}
                <div className="absolute top-2 right-2">
                  {template.templateType === 'badge' ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded-full shadow-lg">
                      <BadgeIcon size={12} />
                      Badge
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full shadow-lg">
                      <Award size={12} />
                      Certificate
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-2 truncate">{template.title}</h3>
                <p className="text-xs text-slate-500 mb-4">
                  {template.elements.length} element(s) • {template.width}×{template.height}px
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Display template in modal
                      alert('Display functionality coming soon');
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100"
                  >
                    <Eye size={14} />
                    Display
                  </button>
                  <button
                    onClick={() => handleDelete(template.id, template.templateType)}
                    disabled={deletingId === template.id}
                    className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingId === template.id ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificateTemplateList;

