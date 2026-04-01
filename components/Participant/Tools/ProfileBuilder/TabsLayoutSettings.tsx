import React from 'react';
import { ProfileDesign } from '../../../../services/profileBuilderService';
import { Layout, Sidebar } from 'lucide-react';

interface TabsLayoutSettingsProps {
  design: ProfileDesign | undefined;
  onUpdate: (updates: Partial<ProfileDesign>) => void;
}

const TabsLayoutSettings: React.FC<TabsLayoutSettingsProps> = ({ design, onUpdate }) => {
  const tabsLayout = design?.tabsLayout || {
    orientation: 'horizontal',
    display: 'per-section',
  };

  const updateTabsLayout = (updates: Partial<ProfileDesign['tabsLayout']>) => {
    onUpdate({
      tabsLayout: {
        ...tabsLayout,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Orientation */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Tabs Orientation
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateTabsLayout({ orientation: 'horizontal' })}
            className={`p-4 border-2 rounded-lg transition-all ${
              tabsLayout.orientation === 'horizontal'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <Layout size={24} className={tabsLayout.orientation === 'horizontal' ? 'text-indigo-600' : 'text-slate-400'} />
              <span className={`text-sm font-medium ${
                tabsLayout.orientation === 'horizontal' ? 'text-indigo-700' : 'text-slate-600'
              }`}>
                Horizontal
              </span>
              <span className="text-xs text-slate-500 text-center">
                Tabs at the top
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => updateTabsLayout({ orientation: 'vertical' })}
            className={`p-4 border-2 rounded-lg transition-all ${
              tabsLayout.orientation === 'vertical'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <Sidebar size={24} className={tabsLayout.orientation === 'vertical' ? 'text-indigo-600' : 'text-slate-400'} />
              <span className={`text-sm font-medium ${
                tabsLayout.orientation === 'vertical' ? 'text-indigo-700' : 'text-slate-600'
              }`}>
                Vertical
              </span>
              <span className="text-xs text-slate-500 text-center">
                Tabs on the left
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Display */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Display Mode
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateTabsLayout({ display: 'full' })}
            className={`p-4 border-2 rounded-lg transition-all ${
              tabsLayout.display === 'full'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 border-2 rounded ${
                tabsLayout.display === 'full' ? 'border-indigo-600' : 'border-slate-400'
              }`}>
                <div className={`h-full w-full bg-gradient-to-b rounded ${
                  tabsLayout.display === 'full' ? 'from-indigo-200 to-indigo-300' : 'from-slate-200 to-slate-300'
                }`}></div>
              </div>
              <span className={`text-sm font-medium ${
                tabsLayout.display === 'full' ? 'text-indigo-700' : 'text-slate-600'
              }`}>
                Full
              </span>
              <span className="text-xs text-slate-500 text-center">
                Scroll down in profile
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => updateTabsLayout({ display: 'per-section' })}
            className={`p-4 border-2 rounded-lg transition-all ${
              tabsLayout.display === 'per-section'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 border-2 rounded ${
                tabsLayout.display === 'per-section' ? 'border-indigo-600' : 'border-slate-400'
              }`}>
                <div className="h-1/2 w-full border-b-2 border-slate-300"></div>
                <div className="h-1/2 w-full"></div>
              </div>
              <span className={`text-sm font-medium ${
                tabsLayout.display === 'per-section' ? 'text-indigo-700' : 'text-slate-600'
              }`}>
                Per Section
              </span>
              <span className="text-xs text-slate-500 text-center">
                Show one section at a time
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabsLayoutSettings;
