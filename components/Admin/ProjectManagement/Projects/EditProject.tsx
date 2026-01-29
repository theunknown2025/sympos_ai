import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Project, updateProject, Axe, Task } from '../../../../services/projectService';
import { getPersonnel, Personnel } from '../../../../services/personnelService';
import { useAuth } from '../../../../hooks/useAuth';
import DateRangePicker from './DateRangePicker';

interface EditProjectProps {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}

const EditProject: React.FC<EditProjectProps> = ({ project, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description || '');
  const [axes, setAxes] = useState<Axe[]>(project.axes || []);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Column visibility toggles
  const [columnVisibility, setColumnVisibility] = useState({
    description: true,
    responsables: true,
    priority: true,
    deadline: true,
    comment: true,
  });

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

  const addAxe = () => {
    const newAxe: Axe = {
      id: `axe-${Date.now()}`,
      name: '',
      tasks: [
        {
          id: `task-${Date.now()}`,
          description: '',
          responsables: [],
          priority: 'medium',
          startDate: '',
          endDate: '',
          comment: '',
        },
      ],
    };
    setAxes([...axes, newAxe]);
  };

  const removeAxe = (axeId: string) => {
    setAxes(axes.filter(axe => axe.id !== axeId));
  };

  const updateAxeName = (axeId: string, name: string) => {
    setAxes(axes.map(axe =>
      axe.id === axeId ? { ...axe, name } : axe
    ));
  };

  const addTask = (axeId: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      description: '',
      responsables: [],
      priority: 'medium',
      startDate: '',
      endDate: '',
      comment: '',
    };
    setAxes(axes.map(axe =>
      axe.id === axeId ? { ...axe, tasks: [...axe.tasks, newTask] } : axe
    ));
  };

  const removeTask = (axeId: string, taskId: string) => {
    setAxes(axes.map(axe =>
      axe.id === axeId ? { ...axe, tasks: axe.tasks.filter(task => task.id !== taskId) } : axe
    ));
  };

  const updateTask = (axeId: string, taskId: string, updates: Partial<Task>) => {
    setAxes(axes.map(axe =>
      axe.id === axeId
        ? {
            ...axe,
            tasks: axe.tasks.map(task =>
              task.id === taskId ? { ...task, ...updates } : task
            ),
          }
        : axe
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    if (axes.length === 0) {
      setError('At least one Axe is required');
      return;
    }

    // Validate axes and tasks
    for (const axe of axes) {
      if (!axe.name.trim()) {
        setError('All Axes must have a name');
        return;
      }
      if (axe.tasks.length === 0) {
        setError('Each Axe must have at least one Task');
        return;
      }
      for (const task of axe.tasks) {
        if (!task.description.trim()) {
          setError('All Tasks must have a description');
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      await updateProject(project.id, {
        name: projectName,
        description: projectDescription || undefined,
        axes,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      console.error('Error updating project:', err);
      setError(err.message || 'Failed to update project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Edit Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Info */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Project Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Axes and Tasks - Table Format */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-300">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-r border-slate-200 sticky left-0 bg-slate-50 z-10 min-w-[200px]">
                      <span>Axe</span>
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold border-r border-slate-200 ${
                      columnVisibility.description ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span>Description</span>
                        <button
                          type="button"
                          onClick={() =>
                            setColumnVisibility({ ...columnVisibility, description: !columnVisibility.description })
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                            columnVisibility.description ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                          title={columnVisibility.description ? 'Deactivate Description Column' : 'Activate Description Column'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              columnVisibility.description ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold border-r border-slate-200 ${
                      columnVisibility.responsables ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span>Responsables</span>
                        <button
                          type="button"
                          onClick={() =>
                            setColumnVisibility({ ...columnVisibility, responsables: !columnVisibility.responsables })
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                            columnVisibility.responsables ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                          title={columnVisibility.responsables ? 'Deactivate Responsables Column' : 'Activate Responsables Column'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              columnVisibility.responsables ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold border-r border-slate-200 ${
                      columnVisibility.priority ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span>Priority</span>
                        <button
                          type="button"
                          onClick={() =>
                            setColumnVisibility({ ...columnVisibility, priority: !columnVisibility.priority })
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                            columnVisibility.priority ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                          title={columnVisibility.priority ? 'Deactivate Priority Column' : 'Activate Priority Column'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              columnVisibility.priority ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold border-r border-slate-200 ${
                      columnVisibility.deadline ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span>Date Range</span>
                        <button
                          type="button"
                          onClick={() =>
                            setColumnVisibility({ ...columnVisibility, deadline: !columnVisibility.deadline })
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                            columnVisibility.deadline ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                          title={columnVisibility.deadline ? 'Deactivate Date Range Column' : 'Activate Date Range Column'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              columnVisibility.deadline ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${
                      columnVisibility.comment ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span>Comment</span>
                        <button
                          type="button"
                          onClick={() =>
                            setColumnVisibility({ ...columnVisibility, comment: !columnVisibility.comment })
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                            columnVisibility.comment ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                          title={columnVisibility.comment ? 'Deactivate Comment Column' : 'Activate Comment Column'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              columnVisibility.comment ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 sticky right-0 bg-slate-50 z-10">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {axes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        <p>No axes added yet. Click "Add Axe" to start.</p>
                      </td>
                    </tr>
                  ) : (
                    axes.flatMap((axe, axeIndex) =>
                      axe.tasks.map((task, taskIndex) => (
                        <tr
                          key={task.id}
                          className={`border-b border-slate-100 hover:bg-slate-50 ${
                            taskIndex === 0 ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          {taskIndex === 0 && (
                            <td
                              rowSpan={axe.tasks.length}
                              className="px-4 py-3 border-r border-slate-200 sticky left-0 bg-indigo-50/30 z-10 align-top min-w-[200px]"
                            >
                              <input
                                type="text"
                                value={axe.name}
                                onChange={(e) => updateAxeName(axe.id, e.target.value)}
                                placeholder={`Axe ${axeIndex + 1} Name`}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold bg-white mb-2"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => addTask(axe.id)}
                                  className="flex-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                                >
                                  <Plus size={12} />
                                  Add Task
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeAxe(axe.id)}
                                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Remove Axe"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                          <td className={`px-4 py-3 border-r border-slate-200 ${!columnVisibility.description ? 'opacity-40' : ''}`}>
                            <input
                              type="text"
                              value={task.description}
                              onChange={(e) =>
                                updateTask(axe.id, task.id, { description: e.target.value })
                              }
                              placeholder="Task description"
                              disabled={!columnVisibility.description}
                              className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm ${
                                columnVisibility.description ? 'bg-white' : 'bg-slate-100 cursor-not-allowed'
                              }`}
                            />
                          </td>
                          <td className={`px-4 py-3 border-r border-slate-200 ${!columnVisibility.responsables ? 'opacity-40' : ''}`}>
                            <select
                              multiple
                              value={task.responsables}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                updateTask(axe.id, task.id, { responsables: selected });
                              }}
                              disabled={!columnVisibility.responsables}
                              className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm min-h-[60px] ${
                                columnVisibility.responsables ? 'bg-white' : 'bg-slate-100 cursor-not-allowed'
                              }`}
                              size={3}
                            >
                              {personnel.map((person) => (
                                <option key={person.id} value={person.id}>
                                  {person.fullName} ({person.role})
                                </option>
                              ))}
                            </select>
                            {columnVisibility.responsables && (
                              <p className="text-xs text-slate-500 mt-1">
                                Ctrl/Cmd + Click
                              </p>
                            )}
                          </td>
                          <td className={`px-4 py-3 border-r border-slate-200 ${!columnVisibility.priority ? 'opacity-40' : ''}`}>
                            <select
                              value={task.priority}
                              onChange={(e) =>
                                updateTask(axe.id, task.id, {
                                  priority: e.target.value as Task['priority'],
                                })
                              }
                              disabled={!columnVisibility.priority}
                              className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm ${
                                columnVisibility.priority ? 'bg-white' : 'bg-slate-100 cursor-not-allowed'
                              }`}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </td>
                          <td className={`px-4 py-3 border-r border-slate-200 relative overflow-visible ${!columnVisibility.deadline ? 'opacity-40' : ''}`}>
                            <div className={!columnVisibility.deadline ? 'pointer-events-none' : ''}>
                              <DateRangePicker
                                startDate={task.startDate}
                                endDate={task.endDate}
                                onChange={(startDate, endDate) =>
                                  updateTask(axe.id, task.id, { startDate, endDate })
                                }
                                className="w-full"
                              />
                            </div>
                          </td>
                          <td className={`px-4 py-3 ${!columnVisibility.comment ? 'opacity-40' : ''}`}>
                            <textarea
                              value={task.comment || ''}
                              onChange={(e) =>
                                updateTask(axe.id, task.id, { comment: e.target.value })
                              }
                              placeholder="Add comment..."
                              rows={2}
                              disabled={!columnVisibility.comment}
                              className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm ${
                                columnVisibility.comment ? 'bg-white' : 'bg-slate-100 cursor-not-allowed'
                              }`}
                            />
                          </td>
                          <td className="px-4 py-3 sticky right-0 bg-white z-10">
                            <button
                              type="button"
                              onClick={() => removeTask(axe.id, task.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove Task"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Row Button */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={addAxe}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Axe
                </button>
                {axes.length > 0 && axes[axes.length - 1]?.tasks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => addTask(axes[axes.length - 1].id)}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Task to Last Axe
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle2 size={20} />
              <span>Project updated successfully!</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Update Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProject;

