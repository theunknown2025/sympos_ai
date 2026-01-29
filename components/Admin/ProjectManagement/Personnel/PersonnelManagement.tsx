import React, { useState } from 'react';
import { Users, UserPlus, List } from 'lucide-react';
import NewPersonnel from './NewPersonnel';
import PersonnelList from './PersonnelList';

const PersonnelManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Personnel Management</h1>
          <p className="text-slate-500 mt-1">Manage your team members and assistants</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'new'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <UserPlus size={18} />
              New Personnel
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'list'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <List size={18} />
              List of Personnel
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'new' ? (
            <NewPersonnel onSuccess={() => setActiveTab('list')} />
          ) : (
            <PersonnelList />
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonnelManagement;

