import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, AlertCircle, CheckCircle2, Calendar, X, Search, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { createProject, Axe, Task } from '../../../../services/projectService';
import { getPersonnel, Personnel } from '../../../../services/personnelService';
import { useAuth } from '../../../../hooks/useAuth';
import DateRangePicker from './DateRangePicker';
import ProjectPreview from './ProjectPreview';

interface NewProjectProps {
  selectedEventId: string | null;
  onEventSelect: (eventId: string | null) => void;
  onSuccess: () => void;
}

const NewProject: React.FC<NewProjectProps> = ({ selectedEventId, onEventSelect, onSuccess }) => {
  const { currentUser } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [axes, setAxes] = useState<Axe[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [projectInfoExpanded, setProjectInfoExpanded] = useState(true);

  // Modal state for selecting responsibles
  const [responsibleModalOpen, setResponsibleModalOpen] = useState(false);
  const [currentTaskForResponsible, setCurrentTaskForResponsible] = useState<{ axeId: string; taskId: string } | null>(null);
  const [responsibleSearchTerm, setResponsibleSearchTerm] = useState('');

  // Column visibility toggles
  const [columnVisibility, setColumnVisibility] = useState({
    description: true,
    responsables: true,
    priority: true,
    deadline: true, // This now represents date range (start/end dates)
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

  const openResponsibleModal = (axeId: string, taskId: string) => {
    setCurrentTaskForResponsible({ axeId, taskId });
    setResponsibleModalOpen(true);
    setResponsibleSearchTerm('');
  };

  const closeResponsibleModal = () => {
    setResponsibleModalOpen(false);
    setCurrentTaskForResponsible(null);
    setResponsibleSearchTerm('');
  };

  const toggleResponsable = (personnelId: string) => {
    if (!currentTaskForResponsible) return;
    
    setAxes(axes.map(axe =>
      axe.id === currentTaskForResponsible.axeId
        ? {
            ...axe,
            tasks: axe.tasks.map(task => {
              if (task.id === currentTaskForResponsible.taskId) {
                const responsables = task.responsables.includes(personnelId)
                  ? task.responsables.filter(id => id !== personnelId)
                  : [...task.responsables, personnelId];
                return { ...task, responsables };
              }
              return task;
            }),
          }
        : axe
    ));
  };

  const removeResponsible = (axeId: string, taskId: string, personnelId: string) => {
    setAxes(axes.map(axe =>
      axe.id === axeId
        ? {
            ...axe,
            tasks: axe.tasks.map(task => {
              if (task.id === taskId) {
                return { ...task, responsables: task.responsables.filter(id => id !== personnelId) };
              }
              return task;
            }),
          }
        : axe
    ));
  };

  const getPersonnelName = (personnelId: string) => {
    const person = personnel.find(p => p.id === personnelId);
    return person ? person.fullName : personnelId;
  };

  const filteredPersonnel = personnel.filter(person =>
    person.fullName.toLowerCase().includes(responsibleSearchTerm.toLowerCase())
  );

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

    if (!currentUser) {
      setError('You must be logged in to create a project');
      return;
    }

    setIsLoading(true);

    try {
      const projectData: any = {
        name: projectName,
        description: projectDescription || undefined,
        axes,
      };

      // Only include eventId if provided
      if (selectedEventId) {
        projectData.eventId = selectedEventId;
      }

      await createProject(currentUser.id, projectData);

      setSuccess(true);
      // Reset form
      setProjectName('');
      setProjectDescription('');
      setAxes([]);

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Info Accordion */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setProjectInfoExpanded(!projectInfoExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-100 transition-colors"
          >
            <h2 className="text-lg font-semibold text-slate-900">Project Information</h2>
            {projectInfoExpanded ? (
              <ChevronUp className="text-slate-600" size={20} />
            ) : (
              <ChevronDown className="text-slate-600" size={20} />
            )}
          </button>
          {projectInfoExpanded && (
            <div className="px-6 pb-6">
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
          )}
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
                  <th className={`px-4 py-3 text-left text-sm font-semibold border-r border-slate-200 w-[250px] ${
                    columnVisibility.description ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span>Tasks</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (axes.length > 0) {
                              addTask(axes[0].id);
                            }
                          }}
                          disabled={axes.length === 0}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Add Task"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setColumnVisibility({ ...columnVisibility, description: !columnVisibility.description })
                        }
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                          columnVisibility.description ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                        title={columnVisibility.description ? 'Deactivate Tasks Column' : 'Activate Tasks Column'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            columnVisibility.description ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold border-r border-slate-200 w-[250px] ${
                    columnVisibility.responsables ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
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
                  <th className={`px-4 py-3 text-left text-sm font-semibold border-r border-slate-200 w-[250px] ${
                    columnVisibility.priority ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
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
                  <th className={`px-4 py-3 text-left text-sm font-semibold border-r border-slate-200 w-[250px] ${
                    columnVisibility.deadline ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
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
                  <th className={`px-4 py-3 text-left text-sm font-semibold w-[250px] ${
                    columnVisibility.comment ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between gap-2">
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
                            className="px-4 py-3 border-r border-slate-200 sticky left-0 bg-indigo-50/30 z-10 align-top min-w-[300px]"
                          >
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => removeAxe(axe.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                title="Remove Axe"
                              >
                                <Trash2 size={18} />
                              </button>
                              <input
                                type="text"
                                value={axe.name}
                                onChange={(e) => updateAxeName(axe.id, e.target.value)}
                                placeholder={`Axe ${axeIndex + 1} Name`}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                              />
                            </div>
                          </td>
                        )}
                            <td className={`px-4 py-3 border-r border-slate-200 w-[250px] ${!columnVisibility.description ? 'opacity-40' : ''}`}>
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
                            <td className={`px-4 py-3 border-r border-slate-200 w-[250px] ${!columnVisibility.responsables ? 'opacity-40' : ''}`}>
                              <div className="space-y-2">
                                {task.responsables.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {task.responsables.map((respId) => (
                                      <span
                                        key={respId}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs"
                                      >
                                        {getPersonnelName(respId)}
                                        {columnVisibility.responsables && (
                                          <button
                                            type="button"
                                            onClick={() => removeResponsible(axe.id, task.id, respId)}
                                            className="hover:bg-indigo-200 rounded p-0.5 transition-colors"
                                            title="Remove"
                                          >
                                            <X size={12} />
                                          </button>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              {columnVisibility.responsables && (
                                  <button
                                    type="button"
                                    onClick={() => openResponsibleModal(axe.id, task.id)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-slate-700"
                                  >
                                    <UserPlus size={14} />
                                    Add Responsible
                                  </button>
                              )}
                              </div>
                            </td>
                            <td className={`px-4 py-3 border-r border-slate-200 w-[250px] ${!columnVisibility.priority ? 'opacity-40' : ''}`}>
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
                            <td className={`px-4 py-3 border-r border-slate-200 relative overflow-visible w-[250px] ${!columnVisibility.deadline ? 'opacity-40' : ''}`}>
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
                            <td className={`px-4 py-3 w-[250px] ${!columnVisibility.comment ? 'opacity-40' : ''}`}>
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
            </div>
          </div>
        </div>

        {/* Project Preview */}
        <ProjectPreview
          projectName={projectName}
          axes={axes}
          personnel={personnel}
        />

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
            <span>Project created successfully! Redirecting to list...</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Creating...
              </>
            ) : (
              <>
                <Save size={20} />
                Create Project
              </>
            )}
          </button>
        </div>
      </form>

      {/* Responsible Selection Modal */}
      {responsibleModalOpen && currentTaskForResponsible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Select Responsibles</h3>
              <button
                type="button"
                onClick={closeResponsibleModal}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={responsibleSearchTerm}
                  onChange={(e) => setResponsibleSearchTerm(e.target.value)}
                  placeholder="Search personnel..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Personnel List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredPersonnel.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p>No personnel found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPersonnel.map((person) => {
                    const currentTask = axes
                      .find(a => a.id === currentTaskForResponsible.axeId)
                      ?.tasks.find(t => t.id === currentTaskForResponsible.taskId);
                    const isSelected = currentTask?.responsables.includes(person.id) || false;

                    return (
                      <label
                        key={person.id}
                        className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleResponsable(person.id)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <span className="flex-1 text-slate-900">{person.fullName}</span>
                        {person.role && (
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {person.role}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={closeResponsibleModal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewProject;

