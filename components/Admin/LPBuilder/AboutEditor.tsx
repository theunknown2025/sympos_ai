import React from 'react';
import { Wand2, ImageIcon, Layout } from 'lucide-react';
import { AboutConfig } from '../../../types';

interface AboutEditorProps {
  description: string;
  isGenerating: boolean;
  onDescriptionChange: (val: string) => void;
  onAiGenerate: () => void;
  aboutConfig?: AboutConfig;
  onAboutConfigChange?: (config: AboutConfig) => void;
}

const AboutEditor: React.FC<AboutEditorProps> = ({ 
  description, 
  isGenerating, 
  onDescriptionChange, 
  onAiGenerate,
  aboutConfig,
  onAboutConfigChange
}) => {
  const updateAboutConfig = (field: keyof AboutConfig, value: any) => {
    if (onAboutConfigChange && aboutConfig) {
      onAboutConfigChange({ ...aboutConfig, [field]: value });
    }
  };

  return (
    <div className="space-y-4">
      {/* Include Image Toggle */}
      {onAboutConfigChange && aboutConfig && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Include Picture</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={aboutConfig.includeImage}
                onChange={(e) => updateAboutConfig('includeImage', e.target.checked)}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>

          {aboutConfig.includeImage && (
            <div className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={aboutConfig.imageUrl}
                  onChange={(e) => updateAboutConfig('imageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Layout</label>
                <div className="space-y-2">
                  <button
                    onClick={() => updateAboutConfig('layout', 'top')}
                    className={`w-full flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                      aboutConfig.layout === 'top'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Layout size={16} />
                    <span className="text-xs font-medium">Image and text on top</span>
                  </button>
                  <button
                    onClick={() => updateAboutConfig('layout', 'left-right')}
                    className={`w-full flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                      aboutConfig.layout === 'left-right'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Layout size={16} />
                    <span className="text-xs font-medium">Text left, image right</span>
                  </button>
                  <button
                    onClick={() => updateAboutConfig('layout', 'right-left')}
                    className={`w-full flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                      aboutConfig.layout === 'right-left'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Layout size={16} />
                    <span className="text-xs font-medium">Text right, image left</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">About / Description</label>
        <div className="relative">
          <textarea 
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none text-sm leading-relaxed bg-white text-slate-900"
          />
          <button 
            onClick={onAiGenerate}
            disabled={isGenerating}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-medium rounded-md transition-colors"
          >
            <Wand2 size={14} className={isGenerating ? "animate-spin" : ""} />
            {isGenerating ? 'Thinking...' : 'AI Write'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutEditor;