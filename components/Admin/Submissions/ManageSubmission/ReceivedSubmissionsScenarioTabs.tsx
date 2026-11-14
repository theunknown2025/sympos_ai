import React from 'react';
import type { ReceivedScenarioTabId } from './receivedSubmissionsUtils';

export interface ReceivedScenarioTabDef {
  id: ReceivedScenarioTabId;
  label: string;
}

interface ReceivedSubmissionsScenarioTabsProps {
  tabs: ReceivedScenarioTabDef[];
  activeTab: ReceivedScenarioTabId;
  onTabChange: (tab: ReceivedScenarioTabId) => void;
}

const ReceivedSubmissionsScenarioTabs: React.FC<ReceivedSubmissionsScenarioTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  if (tabs.length <= 1) return null;

  return (
    <div className="mb-6 border-b border-slate-200">
      <nav className="flex flex-wrap gap-1 -mb-px" aria-label="Submission categories">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border transition-colors ${
                isActive
                  ? 'border-slate-200 border-b-white bg-white text-indigo-700 z-[1] relative mb-[-1px]'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ReceivedSubmissionsScenarioTabs;
