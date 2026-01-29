import React, { useState } from 'react';
import { FileText, Inbox, Send, CheckSquare } from 'lucide-react';
import ReceivedSubmissions from './ManageSubmission/ReceivedSubmissions';
import DispatchSubmissions from './ManageSubmission/DispatchSubmissions';
import SubmissionsEvaluation from './ManageSubmission/SubmissionsEvaluation';

type TabType = 'received' | 'dispatch' | 'evaluation';

const ManageSubmissions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('received');

  const tabs = [
    {
      id: 'received' as TabType,
      label: 'Received Submission',
      icon: Inbox,
    },
    {
      id: 'dispatch' as TabType,
      label: 'Dispatch Submissions',
      icon: Send,
    },
    {
      id: 'evaluation' as TabType,
      label: 'Submissions Evaluation',
      icon: CheckSquare,
    },
  ];

  return (
    <div className="h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileText size={32} className="text-indigo-600" />
            Manage Submissions
          </h1>
          <p className="text-slate-500 mt-1 text-sm">View, edit, and manage all paper submissions</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'received' && <ReceivedSubmissions />}
          {activeTab === 'dispatch' && <DispatchSubmissions />}
          {activeTab === 'evaluation' && <SubmissionsEvaluation />}
        </div>
      </div>
    </div>
  );
};

export default ManageSubmissions;

