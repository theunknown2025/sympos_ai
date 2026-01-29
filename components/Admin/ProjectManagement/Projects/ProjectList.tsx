import React, { useState, useEffect } from 'react';
import { FolderKanban, Edit, Trash2, Loader2, Calendar, ChevronDown, ChevronUp, GanttChartSquare } from 'lucide-react';
import { Project, getProjects, deleteProject } from '../../../../services/projectService';
import { useAuth } from '../../../../hooks/useAuth';
import { getUserEvents } from '../../../../services/eventService';
import { Event } from '../../../../types';
import { getPersonnel, Personnel } from '../../../../services/personnelService';
import EditProject from './EditProject';
import ProjectPlanView from './ProjectPlanView';

interface ProjectListProps {
  onEdit: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onEdit }) => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectWithPlanView, setProjectWithPlanView] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadEvents();
      loadPersonnel();
      loadProjects();
    }
  }, [currentUser]);

  const loadPersonnel = async () => {
    if (!currentUser?.id) return;
    try {
      const personnelList = await getPersonnel(currentUser.id);
      setPersonnel(personnelList);
    } catch (error) {
      console.error('Error loading personnel:', error);
    }
  };

  const loadEvents = async () => {
    if (!currentUser?.id) return;
    try {
      const eventsList = await getUserEvents(currentUser.id);
      setEvents(eventsList);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadProjects = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const projectsList = await getProjects(currentUser.id);
      setProjects(projectsList);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(project.id);
      await deleteProject(project.id);
      await loadProjects();
      // Remove from expanded set if it was expanded
      setExpandedProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(project.id);
        return newSet;
      });
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert(error.message || 'Failed to delete project. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const getPersonnelName = (personnelId: string) => {
    const person = personnel.find(p => p.id === personnelId);
    return person ? person.fullName : personnelId;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getEventName = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : 'Unknown Event';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4">Loading projects...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <FolderKanban size={48} className="mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">No projects found</p>
        <p className="text-sm">Create your first project to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {projects.map((project) => {
          const isExpanded = expandedProjects.has(project.id);
          return (
            <div
              key={project.id}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Accordion Header */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => toggleProject(project.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FolderKanban className="text-indigo-600" size={24} />
                      <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                      {isExpanded ? (
                        <ChevronUp className="text-slate-400" size={20} />
                      ) : (
                        <ChevronDown className="text-slate-400" size={20} />
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-slate-600 mb-2">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>
                          {new Date(project.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span className="font-medium">{getEventName(project.eventId)}</span>
                      </div>
                      <span>{project.axes.length} Axe{project.axes.length !== 1 ? 's' : ''}</span>
                      <span>
                        {project.axes.reduce((total, axe) => total + axe.tasks.length, 0)} Task
                        {project.axes.reduce((total, axe) => total + axe.tasks.length, 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        if (projectWithPlanView === project.id) {
                          setProjectWithPlanView(null);
                        } else {
                          setProjectWithPlanView(project.id);
                        }
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        projectWithPlanView === project.id
                          ? 'text-indigo-600 bg-indigo-50'
                          : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                      }`}
                      title="View Plan"
                    >
                      <GanttChartSquare size={20} />
                    </button>
                    <button
                      onClick={() => setEditingProject(project)}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      disabled={deletingId === project.id}
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <Trash2 size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50 p-6 space-y-6">
                  {/* Show Gantt Plan View OR Table View, not both */}
                  {projectWithPlanView === project.id ? (
                    <ProjectPlanView
                      projects={[project]}
                      personnel={personnel}
                      onClose={() => setProjectWithPlanView(null)}
                      inline={true}
                    />
                  ) : (
                    <>
                      {/* Axes and Tasks Table View */}
                      {project.axes.map((axe, axeIndex) => (
                    <div key={axe.id} className="bg-white rounded-xl p-6 border border-slate-200">
                      <h4 className="text-lg font-semibold text-slate-900 mb-4">
                        Axe {axeIndex + 1}: {axe.name}
                      </h4>

                      {axe.tasks.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-r border-slate-200">
                                  Description
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-r border-slate-200">
                                  Responsables
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-r border-slate-200">
                                  Priority
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-r border-slate-200">
                                  Date Range
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                  Comment
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {axe.tasks.map((task) => (
                                <tr key={task.id} className="border-b border-slate-100">
                                  <td className="px-4 py-3 border-r border-slate-200">
                                    {task.description}
                                  </td>
                                  <td className="px-4 py-3 border-r border-slate-200">
                                    {task.responsables.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {task.responsables.map((respId) => (
                                          <span
                                            key={respId}
                                            className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs"
                                          >
                                            {getPersonnelName(respId)}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic">None assigned</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 border-r border-slate-200">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                                        task.priority
                                      )}`}
                                    >
                                      {task.priority.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 border-r border-slate-200">
                                    {task.startDate && task.endDate ? (
                                      <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span>
                                          {new Date(task.startDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                          })}{' '}
                                          -{' '}
                                          {new Date(task.endDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                          })}
                                        </span>
                                      </div>
                                    ) : task.startDate ? (
                                      <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span>
                                          {new Date(task.startDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                          })}{' '}
                                          - ...
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic">No date range</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {task.comment || <span className="text-slate-400 italic">No comment</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No tasks in this axe</p>
                      )}
                      </div>
                    ))}
                      {/* Project Metadata */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                        <div>
                          <label className="block text-sm font-medium text-slate-500 mb-1">Created At</label>
                          <p className="text-slate-900">
                            {new Date(project.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-500 mb-1">Last Updated</label>
                          <p className="text-slate-900">
                            {new Date(project.updatedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingProject && (
        <EditProject
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={() => {
            setEditingProject(null);
            loadProjects();
          }}
        />
      )}

    </>
  );
};

export default ProjectList;

