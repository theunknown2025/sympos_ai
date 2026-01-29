import React, { useState } from 'react';
import { X, Check, Palette, Sparkles, Crown } from 'lucide-react';
import { ConferenceConfig } from '../../../types';
import { MODERN_MINIMAL_TEMPLATE, MODERN_MINIMAL_METADATA } from './Design1_ModernMinimal';

interface TemplateMetadata {
  name: string;
  description: string;
  category: string;
  previewImage: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  features: string[];
}

interface Template {
  id: string;
  config: ConferenceConfig;
  metadata: TemplateMetadata;
}

// Template registry - will be expanded as we add more designs
const TEMPLATES: Template[] = [
  {
    id: 'modern-minimal',
    config: MODERN_MINIMAL_TEMPLATE,
    metadata: MODERN_MINIMAL_METADATA
  },
  // Design 2 and 3 will be added here
];

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ConferenceConfig) => void;
  onUseDefault?: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ isOpen, onClose, onSelectTemplate, onUseDefault }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (template: Template) => {
    setSelectedTemplateId(template.id);
    onSelectTemplate(template.config);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'modern':
        return <Sparkles size={20} className="text-indigo-600" />;
      case 'professional':
        return <Palette size={20} className="text-blue-600" />;
      case 'classic':
        return <Crown size={20} className="text-amber-600" />;
      default:
        return <Palette size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Choose a Template</h2>
            <p className="text-slate-500 mt-1">Select a design template to start building your landing page</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.map((template) => (
              <div
                key={template.id}
                onClick={() => handleSelect(template)}
                className={`group relative bg-white border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${
                  selectedTemplateId === template.id
                    ? 'border-indigo-600 shadow-lg shadow-indigo-200'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                {/* Preview Image */}
                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                  <img
                    src={template.metadata.previewImage}
                    alt={template.metadata.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    {getCategoryIcon(template.metadata.category)}
                    <span className="text-xs font-semibold text-slate-700">{template.metadata.category}</span>
                  </div>

                  {/* Selected Indicator */}
                  {selectedTemplateId === template.id && (
                    <div className="absolute top-3 right-3 bg-indigo-600 rounded-full p-1.5">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{template.metadata.name}</h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{template.metadata.description}</p>

                  {/* Color Scheme Preview */}
                  <div className="flex items-center gap-1 mb-4">
                    {Object.values(template.metadata.colorScheme).slice(0, 5).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* Features */}
                  <div className="space-y-1">
                    {template.metadata.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {template.metadata.features.length > 3 && (
                      <div className="text-xs text-slate-400 mt-2">
                        +{template.metadata.features.length - 3} more features
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Coming Soon Placeholder */}
          <div className="mt-8 p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 text-center">
            <p className="text-slate-500 text-sm">
              More templates coming soon! Check back for Design 2 and Design 3.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            You can customize all aspects of the template after selection
          </p>
          <div className="flex items-center gap-3">
            {onUseDefault && (
              <button
                onClick={() => {
                  onUseDefault();
                  onClose();
                }}
                className="px-4 py-2 text-slate-600 hover:bg-white rounded-lg transition-colors"
              >
                Use Default Template
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
