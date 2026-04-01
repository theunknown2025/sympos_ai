import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

interface EducationSectionProps {
  data: {
    educations: Education[];
  };
  onChange: (data: { educations: Education[] }) => void;
}

const EducationSection: React.FC<EducationSectionProps> = ({ data, onChange }) => {
  const handleAddEducation = () => {
    onChange({
      educations: [
        ...data.educations,
        {
          id: uuidv4(),
          institution: '',
          degree: '',
          field: '',
          startDate: '',
          endDate: '',
        },
      ],
    });
  };

  const handleRemoveEducation = (id: string) => {
    onChange({
      educations: data.educations.filter((edu) => edu.id !== id),
    });
  };

  const handleUpdateEducation = (id: string, field: keyof Education, value: string) => {
    onChange({
      educations: data.educations.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    });
  };

  return (
    <div className="space-y-4">
      {data.educations.map((education, index) => (
        <div key={education.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">Education {index + 1}</h4>
            {data.educations.length > 1 && (
              <button
                onClick={() => handleRemoveEducation(education.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove education"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Institution</label>
              <input
                type="text"
                value={education.institution || ''}
                onChange={(e) => handleUpdateEducation(education.id, 'institution', e.target.value)}
                placeholder="University Name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Degree</label>
                <input
                  type="text"
                  value={education.degree || ''}
                  onChange={(e) => handleUpdateEducation(education.id, 'degree', e.target.value)}
                  placeholder="Bachelor's, Master's, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Field of Study</label>
                <input
                  type="text"
                  value={education.field || ''}
                  onChange={(e) => handleUpdateEducation(education.id, 'field', e.target.value)}
                  placeholder="Computer Science"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="text"
                  value={education.startDate || ''}
                  onChange={(e) => handleUpdateEducation(education.id, 'startDate', e.target.value)}
                  placeholder="MM/YYYY"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                <input
                  type="text"
                  value={education.endDate || ''}
                  onChange={(e) => handleUpdateEducation(education.id, 'endDate', e.target.value)}
                  placeholder="MM/YYYY or Present"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddEducation}
        className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add Education
      </button>
    </div>
  );
};

export default EducationSection;
