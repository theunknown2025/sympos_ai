import React from 'react';
import { HeaderConfig } from '../../../../../types';

interface HeaderEditorProps {
  config: HeaderConfig;
  onChange: (config: HeaderConfig) => void;
}

const HeaderEditor: React.FC<HeaderEditorProps> = ({ config, onChange }) => {
  const update = (field: keyof HeaderConfig, value: any) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">Show Logo</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={config.showLogo}
            onChange={(e) => update('showLogo', e.target.checked)}
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
        </label>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">Show Title</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={config.showTitle}
            onChange={(e) => update('showTitle', e.target.checked)}
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
        </label>
      </div>
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-700">Show Action Button</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={config.showActionButton}
              onChange={(e) => update('showActionButton', e.target.checked)}
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
          </label>
        </div>
        {config.showActionButton && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Button Text</label>
              <input 
                type="text" 
                value={config.actionButtonText}
                onChange={(e) => update('actionButtonText', e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Button Link</label>
              <input 
                type="text" 
                value={config.actionButtonUrl}
                onChange={(e) => update('actionButtonUrl', e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-900"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderEditor;
