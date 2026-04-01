import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Project {
  id: string;
  name: string;
  description: string;
  technologies?: string;
  url?: string;
  startDate: string;
  endDate: string;
}

interface ProjectsSectionProps {
  data: {
    projects: Project[];
  };
  onChange: (data: { projects: Project[] }) => void;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ data, onChange }) => {
  const handleAddProject = () => {
    onChange({
      projects: [
        ...data.projects,
        {
          id: uuidv4(),
          name: '',
          description: '',
          technologies: '',
          url: '',
          startDate: '',
          endDate: '',
        },
      ],
    });
  };

  const handleRemoveProject = (id: string) => {
    onChange({
      projects: data.projects.filter((project) => project.id !== id),
    });
  };

  const handleUpdateProject = (id: string, field: keyof Project, value: string) => {
    onChange({
      projects: data.projects.map((project) =>
        project.id === id ? { ...project, [field]: value } : project
      ),
    });
  };

  return (
    <div className="space-y-4">
      {data.projects.map((project, index) => (
        <div key={project.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">Project {index + 1}</h4>
            {data.projects.length > 1 && (
              <button
                onClick={() => handleRemoveProject(project.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove project"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Project Name</label>
              <input
                type="text"
                value={project.name || ''}
                onChange={(e) => handleUpdateProject(project.id, 'name', e.target.value)}
                placeholder="Project Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={project.description || ''}
                onChange={(e) => handleUpdateProject(project.id, 'description', e.target.value)}
                placeholder="Describe the project, your role, and key achievements..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Technologies Used (Optional)</label>
              <input
                type="text"
                value={project.technologies || ''}
                onChange={(e) => handleUpdateProject(project.id, 'technologies', e.target.value)}
                placeholder="e.g., React, Node.js, MongoDB"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="text"
                  value={project.startDate || ''}
                  onChange={(e) => handleUpdateProject(project.id, 'startDate', e.target.value)}
                  placeholder="MM/YYYY"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="text"
                  value={project.endDate || ''}
                  onChange={(e) => handleUpdateProject(project.id, 'endDate', e.target.value)}
                  placeholder="MM/YYYY or Present"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Project URL (Optional)</label>
              <input
                type="url"
                value={project.url || ''}
                onChange={(e) => handleUpdateProject(project.id, 'url', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddProject}
        className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add Project
      </button>
    </div>
  );
};

export default ProjectsSection;
