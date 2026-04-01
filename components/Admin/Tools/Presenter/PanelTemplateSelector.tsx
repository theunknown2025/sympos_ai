import React, { useState } from 'react';
import { X, Layout, Check } from 'lucide-react';
import { panelTemplates, PanelTemplate } from './Templates/Panels';
import { PresenterPanel, PresenterEvent } from '../../../../types';

interface PanelTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
  selectedTemplateId?: string;
  panel?: PresenterPanel;
  event?: PresenterEvent;
}

const PanelTemplateSelector: React.FC<PanelTemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedTemplateId,
  panel,
  event,
}) => {
  const [previewTemplate, setPreviewTemplate] = useState<PanelTemplate | null>(null);

  // Auto-show preview for selected template or first template
  React.useEffect(() => {
    if (isOpen && panelTemplates.length > 0) {
      const templateToPreview = selectedTemplateId
        ? panelTemplates.find(t => t.id === selectedTemplateId) || panelTemplates[0]
        : panelTemplates[0];
      setPreviewTemplate(templateToPreview);
    }
  }, [isOpen, selectedTemplateId]);

  if (!isOpen) return null;

  // Create mock data for preview if not provided
  const mockPanel: PresenterPanel = panel || {
    id: 'preview',
    userId: '',
    eventId: '',
    title: 'Panel Discussion: Future of Technology',
    moderatorName: 'Jane Smith',
    moderatorTitle: 'Conference Chair',
    moderatorEntity: 'Tech Institute',
    moderatorPicture: '',
    speakers: [
      { name: 'John Doe', title: 'Professor', entity: 'University A', picture: '' },
      { name: 'Alice Johnson', title: 'Researcher', entity: 'University B', picture: '' },
    ],
    displayOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEvent: PresenterEvent = event || {
    id: 'preview',
    userId: '',
    name: 'International Conference 2024',
    place: 'Paris, France',
    date: new Date(),
    link: 'https://example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const handleSelect = (template: PanelTemplate) => {
    onSelect(template.id);
    onClose();
  };

  const handlePreview = (template: PanelTemplate) => {
    setPreviewTemplate(template);
  };

  const handleUseTemplate = () => {
    if (previewTemplate) {
      handleSelect(previewTemplate);
    }
  };

  if (panelTemplates.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Panel Templates</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-6 text-center">
            <Layout className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 mb-2">No panel templates available yet</p>
            <p className="text-sm text-slate-400">Panel templates will be added soon</p>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Select Panel Template</h2>
            <p className="text-sm text-slate-500 mt-1">Choose a template to display your panels</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Template List */}
          <div className="w-[15%] border-r border-slate-200 overflow-y-auto p-4">
            <div className="space-y-3">
              {panelTemplates.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                const TemplateComponent = template.component;

                return (
                  <div
                    key={template.id}
                    className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                    onClick={() => {
                      handlePreview(template);
                      handleSelect(template);
                    }}
                    onMouseEnter={() => handlePreview(template)}
                  >
                    {/* Thumbnail Preview */}
                    <div 
                      className="relative h-32 bg-slate-50 overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(template);
                      }}
                    >
                      {template.preview ? (
                        <img
                          src={template.preview}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full relative bg-gradient-to-br from-slate-100 to-slate-200">
                          {/* Render actual template preview as thumbnail */}
                          <div className="absolute inset-0 overflow-hidden" style={{ transform: 'scale(0.2)', transformOrigin: 'top left', width: '500%', height: '500%', pointerEvents: 'none' }}>
                            <div className="relative w-full h-full" style={{ position: 'relative', minHeight: '600px' }}>
                              <TemplateComponent panel={mockPanel} event={mockEvent} />
                            </div>
                          </div>
                          {/* Overlay for better thumbnail visibility */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent"></div>
                          {/* Template name overlay */}
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium text-slate-700 text-center">
                              {template.name}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Selected Badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-1.5 shadow-lg z-10">
                          <Check size={14} />
                        </div>
                      )}
                      {/* Hover indicator */}
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-indigo-500/10 flex items-center justify-center pointer-events-none">
                        <div className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-slate-700 shadow-lg">
                          Click to Preview
                        </div>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="p-2 bg-white">
                      <h3 className="font-semibold text-slate-900 mb-1 text-xs">{template.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{template.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 bg-slate-50 overflow-y-auto p-6">
            {previewTemplate ? (() => {
              const PreviewTemplateComponent = previewTemplate.component;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Preview: {previewTemplate.name}</h3>
                    <button
                      onClick={() => setPreviewTemplate(null)}
                      className="text-sm text-slate-500 hover:text-slate-700"
                    >
                      Close Preview
                    </button>
                  </div>
                  <div className="bg-slate-50 rounded-lg shadow-lg overflow-hidden border border-slate-200 relative" style={{ aspectRatio: '16/9', height: '450px' }}>
                    <div className="absolute inset-0 overflow-hidden" style={{ transform: 'scale(0.35)', transformOrigin: 'top left', width: '285.7%', height: '285.7%' }}>
                      <div className="relative w-full h-full" style={{ position: 'relative', minHeight: '600px' }}>
                        <PreviewTemplateComponent panel={mockPanel} event={mockEvent} />
                      </div>
                    </div>
                    {/* Scale indicator */}
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                      Preview (35% scale)
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 text-center mt-3">
                    Click the template card or use the "Select Template" button below to apply
                  </div>
                </div>
              );
            })() : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <Layout className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500">Select a template to see preview</p>
                  <p className="text-sm text-slate-400 mt-2">Or hover over a template and click "Preview"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {selectedTemplateId ? (
              <span className="flex items-center gap-2">
                <Check className="text-indigo-600" size={16} />
                Template selected: <span className="font-medium text-slate-700">
                  {panelTemplates.find(t => t.id === selectedTemplateId)?.name}
                </span>
              </span>
            ) : (
              'No template selected'
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            {previewTemplate && (
              <button
                onClick={handleUseTemplate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Select Template
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanelTemplateSelector;
