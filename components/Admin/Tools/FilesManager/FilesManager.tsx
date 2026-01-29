import React, { useState } from 'react';
import { FileText, Image, Video } from 'lucide-react';
import DocumentsTab from './DocumentsTab';
import MediaTab from './MediaTab';

type TabType = 'documents' | 'media';

const FilesManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('documents');

  const tabs = [
    {
      id: 'documents' as TabType,
      label: 'Documents',
      icon: FileText,
    },
    {
      id: 'media' as TabType,
      label: 'Media',
      icon: Image,
    },
  ];

  return (
    <div className="h-full">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Files Manager</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your documents and media files</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'documents' && <DocumentsTab />}
          {activeTab === 'media' && <MediaTab />}
        </div>
      </div>
    </div>
  );
};

export default FilesManager;

