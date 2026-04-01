import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getEditorTranslations } from '../editorTranslations';

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ExperiencesSectionProps {
  data: {
    experiences: Experience[];
  };
  onChange: (data: { experiences: Experience[] }) => void;
  language?: 'en' | 'fr' | 'ar';
  direction?: 'ltr' | 'rtl';
}

const ExperiencesSection: React.FC<ExperiencesSectionProps> = ({
  data,
  onChange,
  language = 'en',
  direction = 'ltr',
}) => {
  const t = getEditorTranslations(language);
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
    <div className="space-y-4" dir={direction}>
      {data.experiences.map((experience, index) => (
        <div key={experience.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">{t.experience} {index + 1}</h4>
            {data.experiences.length > 1 && (
              <button
                onClick={() => handleRemoveExperience(experience.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title={t.remove}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.company}</label>
              <input
                type="text"
                value={experience.company || ''}
                onChange={(e) => handleUpdateExperience(experience.id, 'company', e.target.value)}
                placeholder={direction === 'rtl' ? 'اسم الشركة أو المؤسسة' : 'Company or Institution Name'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                dir={direction}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.position}</label>
              <input
                type="text"
                value={experience.position || ''}
                onChange={(e) => handleUpdateExperience(experience.id, 'position', e.target.value)}
                placeholder={direction === 'rtl' ? 'المسمى الوظيفي' : 'Job Title or Role'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                dir={direction}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.startDate}</label>
                <input
                  type="text"
                  value={experience.startDate || ''}
                  onChange={(e) => handleUpdateExperience(experience.id, 'startDate', e.target.value)}
                  placeholder={direction === 'rtl' ? 'شهر/سنة' : 'MM/YYYY'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  dir={direction}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.endDate}</label>
                <input
                  type="text"
                  value={experience.endDate || ''}
                  onChange={(e) => handleUpdateExperience(experience.id, 'endDate', e.target.value)}
                  placeholder={direction === 'rtl' ? `شهر/سنة أو ${t.present}` : `MM/YYYY or ${t.present}`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  dir={direction}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.description}</label>
              <textarea
                value={experience.description || ''}
                onChange={(e) => handleUpdateExperience(experience.id, 'description', e.target.value)}
                placeholder={direction === 'rtl' ? 'وصف المسؤوليات والإنجازات...' : 'Describe your responsibilities and achievements...'}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
                dir={direction}
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
        {t.add} {t.experience}
      </button>
    </div>
  );
};

export default ExperiencesSection;
