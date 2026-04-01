import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Skill {
  id: string;
  name: string;
  proficiency: string; // e.g., "Beginner", "Intermediate", "Advanced", "Expert"
}

interface SkillsSectionProps {
  data: {
    skills: Skill[];
  };
  onChange: (data: { skills: Skill[] }) => void;
}

const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const SkillsSection: React.FC<SkillsSectionProps> = ({ data, onChange }) => {
  const handleAddSkill = () => {
    onChange({
      skills: [
        ...data.skills,
        {
          id: uuidv4(),
          name: '',
          proficiency: 'Intermediate',
        },
      ],
    });
  };

  const handleRemoveSkill = (id: string) => {
    onChange({
      skills: data.skills.filter((skill) => skill.id !== id),
    });
  };

  const handleUpdateSkill = (id: string, field: keyof Skill, value: string) => {
    onChange({
      skills: data.skills.map((skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill
      ),
    });
  };

  return (
    <div className="space-y-4">
      {data.skills.map((skill, index) => (
        <div key={skill.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">Skill {index + 1}</h4>
            {data.skills.length > 1 && (
              <button
                onClick={() => handleRemoveSkill(skill.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove skill"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Skill Name</label>
              <input
                type="text"
                value={skill.name || ''}
                onChange={(e) => handleUpdateSkill(skill.id, 'name', e.target.value)}
                placeholder="e.g., JavaScript, Project Management"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Proficiency Level</label>
              <select
                value={skill.proficiency || 'Intermediate'}
                onChange={(e) => handleUpdateSkill(skill.id, 'proficiency', e.target.value)}
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
        onClick={handleAddSkill}
        className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add Skill
      </button>
    </div>
  );
};

export default SkillsSection;
