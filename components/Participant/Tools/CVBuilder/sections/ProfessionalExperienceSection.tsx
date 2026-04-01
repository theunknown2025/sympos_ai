import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ProfessionalExperienceSectionProps {
  data: {
    experiences: Experience[];
  };
  onChange: (data: { experiences: Experience[] }) => void;
}

const ProfessionalExperienceSection: React.FC<ProfessionalExperienceSectionProps> = ({
  data,
  onChange,
}) => {
  const handleAddExperience = () => {
    onChange({
      experiences: [
        ...data.experiences,
        {
          id: uuidv4(),
          company: '',
          position: '',
          startDate: '',
          endDate: '',
          description: '',
        },
      ],
    });
  };

  const handleRemoveExperience = (id: string) => {
    onChange({
      experiences: data.experiences.filter((exp) => exp.id !== id),
    });
  };

  const handleUpdateExperience = (id: string, field: keyof Experience, value: string) => {
    onChange({
      experiences: data.experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    });
  };

  return (
    <div className="space-y-4">
      {data.experiences.map((experience, index) => (
        <div key={experience.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">Experience {index + 1}</h4>
            {data.experiences.length > 1 && (
              <button
                onClick={() => handleRemoveExperience(experience.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove experience"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Company</label>
              <input
                type="text"
                value={experience.company || ''}
                onChange={(e) => handleUpdateExperience(experience.id, 'company', e.target.value)}
                placeholder="Company Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Position</label>
              <input
                type="text"
                value={experience.position || ''}
                onChange={(e) => handleUpdateExperience(experience.id, 'position', e.target.value)}
                placeholder="Job Title"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="text"
                  value={experience.startDate || ''}
                  onChange={(e) => handleUpdateExperience(experience.id, 'startDate', e.target.value)}
                  placeholder="MM/YYYY"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="text"
                  value={experience.endDate || ''}
                  onChange={(e) => handleUpdateExperience(experience.id, 'endDate', e.target.value)}
                  placeholder="MM/YYYY or Present"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={experience.description || ''}
                onChange={(e) => handleUpdateExperience(experience.id, 'description', e.target.value)}
                placeholder="Describe your responsibilities and achievements..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddExperience}
        className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add Experience
      </button>
    </div>
  );
};

export default ProfessionalExperienceSection;
