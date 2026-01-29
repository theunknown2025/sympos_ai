import React, { useState } from 'react';
import { Mail, FileText, Plus } from 'lucide-react';
import NewEmailTemplate from './NewEmailTemplate';
import EmailTemplateList from './EmailTemplateList';
import EditEmailTemplate from './EditEmailTemplate';

const Emailer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('list');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewTemplate = () => {
    setEditingTemplateId(null);
    setActiveTab('new');
  };

  const handleEditTemplate = (templateId: string) => {
    setEditingTemplateId(templateId);
    setActiveTab('new');
  };

  const handleSave = () => {
    setEditingTemplateId(null);
    setActiveTab('list');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setEditingTemplateId(null);
    setActiveTab('list');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Mail className="text-indigo-600" size={32} />
              Email Templates
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Create and manage email templates with placeholders and attachments
            </p>
          </div>
          {activeTab === 'list' && (
            <button
              onClick={handleNewTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              New Template
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => {
            setEditingTemplateId(null);
            setActiveTab('list');
          }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'list'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText size={16} />
            List of Templates
          </div>
        </button>
        {activeTab === 'new' && (
          <button
            className="px-4 py-2 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600"
          >
            <div className="flex items-center gap-2">
              <Plus size={16} />
              {editingTemplateId ? 'Edit Template' : 'New Template'}
            </div>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'list' ? (
          <EmailTemplateList
            onEdit={handleEditTemplate}
            onNew={handleNewTemplate}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <NewEmailTemplate
            templateId={editingTemplateId}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
};

export default Emailer;

