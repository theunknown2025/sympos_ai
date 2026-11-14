import React, { useState, useEffect } from 'react';
import { FolderKanban } from 'lucide-react';
import NewProject from './NewProject';
import ProjectList from './ProjectList';
import { useOrganizerScopedEventId } from '../../../../contexts/OrganizerEventScopeContext';
import { useAuth } from '../../../../hooks/useAuth';
import { getProjectsByEvent } from '../../../../services/projectService';
import EventResourceLimitModal from '../../EventResources/EventResourceLimitModal';

const Projects: React.FC = () => {
  const organizerScopedEventId = useOrganizerScopedEventId();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [projectSlotBlocked, setProjectSlotBlocked] = useState(false);

  useEffect(() => {
    if (organizerScopedEventId) {
      setSelectedEventId(organizerScopedEventId);
    }
  }, [organizerScopedEventId]);

  useEffect(() => {
    if (!organizerScopedEventId || !currentUser?.id) return;
    let cancelled = false;
    void getProjectsByEvent(currentUser.id, organizerScopedEventId)
      .then((existing) => {
        if (!cancelled && existing.length >= 1) setActiveTab('list');
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [organizerScopedEventId, currentUser?.id]);

  const openNewProject = async () => {
    if (organizerScopedEventId && currentUser?.id) {
      const existing = await getProjectsByEvent(currentUser.id, organizerScopedEventId);
      if (existing.length >= 1) {
        setProjectSlotBlocked(true);
        setActiveTab('list');
        return;
      }
    }
    setActiveTab('new');
  };

  return (
    <div className="space-y-6">
      {projectSlotBlocked && (
        <EventResourceLimitModal slot="project" onClose={() => setProjectSlotBlocked(false)} />
      )}
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
              onClick={() => void openNewProject()}
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

