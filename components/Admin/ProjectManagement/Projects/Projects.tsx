import React, { useState } from 'react';
import { FolderKanban } from 'lucide-react';
import NewProject from './NewProject';
import ProjectList from './ProjectList';

const Projects: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1">Manage and track your projects</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'new'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <FolderKanban size={18} />
              New Project
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'list'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              List of Projects
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'new' ? (
            <NewProject
              selectedEventId={selectedEventId}
              onEventSelect={setSelectedEventId}
              onSuccess={() => {
                setActiveTab('list');
                setSelectedEventId(null);
              }}
            />
          ) : (
            <ProjectList
              onEdit={(projectId) => {
                // Handle edit - could open edit modal or navigate
                console.log('Edit project:', projectId);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;

