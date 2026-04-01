import React, { useState } from 'react';
import { FileText, List } from 'lucide-react';
import CVBuilderEditor from './CVBuilderEditor';
import CVList from './CVList';
import { CV } from '../../../services/cvService';

const CVBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);

  const handleSelectCV = (cv: CV) => {
    setSelectedCV(cv);
    setActiveTab('new');
  };

  const handleNewCV = () => {
    setSelectedCV(null);
    setActiveTab('new');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">CV Builder</h1>
        <p className="text-slate-600">Create and manage your professional CVs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={handleNewCV}
          className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'new'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText size={18} />
          New CV
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'list'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List size={18} />
          List of CVs
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'new' ? (
          <CVBuilderEditor initialCV={selectedCV} />
        ) : (
          <CVList onSelectCV={handleSelectCV} />
        )}
      </div>
    </div>
  );
};

export default CVBuilder;
