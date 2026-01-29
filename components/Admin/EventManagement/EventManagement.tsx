import React, { useState } from 'react';
import { Plus, List } from 'lucide-react';
import NewEvent from './NewEvent';
import ListOfEvents from './ListOfEvents';

const EventManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
  const [refreshList, setRefreshList] = useState(0);

  const handleEventSaved = () => {
    setActiveTab('list');
    setRefreshList(prev => prev + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Event Management</h1>
        <p className="text-slate-500 mt-2">Manage all aspects of your event from one central location</p>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'new'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus size={16} />
              New Event
            </div>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'list'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <List size={16} />
              List of Events
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'new' ? (
          <NewEvent onSave={handleEventSaved} onCancel={() => setActiveTab('list')} />
        ) : (
          <ListOfEvents key={refreshList} />
        )}
      </div>
    </div>
  );
};

export default EventManagement;

