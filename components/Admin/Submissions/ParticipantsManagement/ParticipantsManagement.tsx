import React, { useState } from 'react';
import { Users, UserCog, Mail, List } from 'lucide-react';
import AccountManager from './AccountManager/AccountManager';
import InvitationsManager from './InvitationsManager/InvitationsManager';
import ParticipantsList from './ParticipantsList/ParticipantsList';

type TabType = 'account-manager' | 'invitations-manager' | 'list';

const ParticipantsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('account-manager');

  const tabs = [
    {
      id: 'account-manager' as TabType,
      label: 'Account Manager',
      icon: UserCog,
    },
    {
      id: 'invitations-manager' as TabType,
      label: 'Invitations Manager',
      icon: Mail,
    },
    {
      id: 'list' as TabType,
      label: 'Liste Participants',
      icon: List,
    },
  ];

  return (
    <div className="h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users size={32} className="text-indigo-600" />
            Participants
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage participant accounts, invitations, and registrations
          </p>
        </div>
      </header>

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

        <div className="p-6">
          {activeTab === 'account-manager' && <AccountManager />}
          {activeTab === 'invitations-manager' && <InvitationsManager />}
          {activeTab === 'list' && <ParticipantsList />}
        </div>
      </div>
    </div>
  );
};

export default ParticipantsManagement;
