import React from 'react';
import { Layout, ScrollText, Sparkles } from 'lucide-react';
import { ProfileDesign } from '../../../../../services/profileBuilderService';

interface TemplateSelectorProps {
  design: ProfileDesign | undefined;
  onUpdate: (design: ProfileDesign) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ design, onUpdate }) => {
  const currentTemplate = design?.template || 'default';

  const templates = [
    {
      id: 'default' as const,
      name: 'Default',
      description: 'Classic tabbed layout with clean design',
      icon: Layout,
      preview: 'bg-gradient-to-br from-slate-50 to-slate-100',
    },
    {
      id: 'advanced' as const,
      name: 'Advanced',
      description: 'Modern card-based layout with elegant design',
      icon: Sparkles,
      preview: 'bg-gradient-to-br from-indigo-50 to-purple-50',
    },
    {
      id: 'advanced2' as const,
      name: 'Classic',
      description: 'Traditional CV-style layout with serif headings and formal palette',
      icon: ScrollText,
      preview: 'bg-gradient-to-b from-[#f4f1ea] to-[#e8e0d5]',
    },
  ];

  const updateTemplate = (templateId: 'default' | 'advanced' | 'advanced2') => {
    onUpdate({
      ...design,
      template: templateId,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Profile Template
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const Icon = template.icon;
            const isSelected = currentTemplate === template.id;
            
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => updateTemplate(template.id)}
                className={`p-6 border-2 rounded-xl transition-all text-left ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg mb-1 ${
                      isSelected ? 'text-indigo-900' : 'text-slate-900'
                    }`}>
                      {template.name}
                    </h3>
                    <p className={`text-sm ${
                      isSelected ? 'text-indigo-700' : 'text-slate-600'
                    }`}>
                      {template.description}
                    </p>
                    <div className={`mt-3 h-20 rounded-lg ${template.preview} border border-slate-200`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
