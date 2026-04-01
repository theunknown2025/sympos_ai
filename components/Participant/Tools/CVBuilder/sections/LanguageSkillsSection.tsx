import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Language {
  id: string;
  name: string;
  proficiency: string; // e.g., "Native", "Fluent", "Advanced", "Intermediate", "Basic"
}

interface LanguageSkillsSectionProps {
  data: {
    languages: Language[];
  };
  onChange: (data: { languages: Language[] }) => void;
}

const proficiencyLevels = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'];

const LanguageSkillsSection: React.FC<LanguageSkillsSectionProps> = ({ data, onChange }) => {
  const handleAddLanguage = () => {
    onChange({
      languages: [
        ...data.languages,
        {
          id: uuidv4(),
          name: '',
          proficiency: 'Intermediate',
        },
      ],
    });
  };

  const handleRemoveLanguage = (id: string) => {
    onChange({
      languages: data.languages.filter((lang) => lang.id !== id),
    });
  };

  const handleUpdateLanguage = (id: string, field: keyof Language, value: string) => {
    onChange({
      languages: data.languages.map((lang) =>
        lang.id === id ? { ...lang, [field]: value } : lang
      ),
    });
  };

  return (
    <div className="space-y-4">
      {data.languages.map((language, index) => (
        <div key={language.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">Language {index + 1}</h4>
            {data.languages.length > 1 && (
              <button
                onClick={() => handleRemoveLanguage(language.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove language"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Language</label>
              <input
                type="text"
                value={language.name || ''}
                onChange={(e) => handleUpdateLanguage(language.id, 'name', e.target.value)}
                placeholder="e.g., English, French, Spanish"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Proficiency Level</label>
              <select
                value={language.proficiency || 'Intermediate'}
                onChange={(e) => handleUpdateLanguage(language.id, 'proficiency', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                {proficiencyLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddLanguage}
        className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add Language
      </button>
    </div>
  );
};

export default LanguageSkillsSection;
