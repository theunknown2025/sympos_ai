import React, { useState, useEffect } from 'react';
import { X, FolderKanban, Calendar } from 'lucide-react';
import { Project } from '../../../../services/projectService';
import { getPersonnel, Personnel } from '../../../../services/personnelService';
import { useAuth } from '../../../../hooks/useAuth';

interface ProjectViewModalProps {
  project: Project;
  onClose: () => void;
}

const ProjectViewModal: React.FC<ProjectViewModalProps> = ({ project, onClose }) => {
  const { currentUser } = useAuth();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadPersonnel();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderKanban className="text-indigo-600" size={24} />
            <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Info */}
          {project.description && (
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Description</label>
              <p className="text-slate-900">{project.description}</p>
            </div>
          )}

          {/* Axes and Tasks */}
          <div className="space-y-6">
            {project.axes.map((axe, axeIndex) => (
              <div key={axe.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Axe {axeIndex + 1}: {axe.name}
                </h3>

                {axe.tasks.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-200">
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
                          <tr key={task.id} className="border-b border-slate-100 bg-white">
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
          </div>

          {/* Dates */}
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
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectViewModal;

