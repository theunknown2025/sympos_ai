import React, { useState } from 'react';
import { Users, UserPlus, UserCheck, List, FilePlus, Search } from 'lucide-react';
import NewCommittee from './NewCommittee';
import CommitteesList from './CommitteesList';
import MemberForm from './MemberForm';
import MembersList from './MembersList';
import { Committee } from '../../../types';

const Dashboard: React.FC = () => {
  const [mainTab, setMainTab] = useState<'committees' | 'membres'>('committees');
  const [committeesSubTab, setCommitteesSubTab] = useState<'new' | 'list'>('new');
  const [membresSubTab, setMembresSubTab] = useState<'new' | 'list'>('new');
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showParticipantSearch, setShowParticipantSearch] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [committeesRefreshTrigger, setCommitteesRefreshTrigger] = useState(0);

  const handleEditMember = (member: any) => {
    setEditingMember(member);
    setShowMemberForm(true);
  };

  const handleFormClose = () => {
    setShowMemberForm(false);
    setEditingMember(null);
  };

  const handleEditCommittee = (committee: Committee) => {
    setEditingCommittee(committee);
    setCommitteesSubTab('new');
  };

  const handleCommitteeSuccess = () => {
    setEditingCommittee(null);
    setCommitteesSubTab('list');
    // Trigger refresh of committees list
    setCommitteesRefreshTrigger(prev => prev + 1);
  };

  const handleCommitteeClose = () => {
    setEditingCommittee(null);
  };

  return (
    <div className="h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Users size={32} className="text-indigo-600" />
          Manage Committee
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Manage review committees and members</p>
      </header>

      {/* Main Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex w-full border-b border-slate-200">
          <button
            onClick={() => setMainTab('committees')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              mainTab === 'committees'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck size={18} className="flex-shrink-0" />
            <span>Committees</span>
          </button>
          <button
            onClick={() => setMainTab('membres')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
              mainTab === 'membres'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users size={18} className="flex-shrink-0" />
            <span>Membres</span>
          </button>
        </div>

        {/* Committees Tab Content */}
        {mainTab === 'committees' && (
          <div>
            {/* Sub-tabs for Committees */}
            <div className="flex w-full border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setCommitteesSubTab('new')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  committeesSubTab === 'new'
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FilePlus size={18} className="flex-shrink-0" />
                <span>New Committee</span>
              </button>
              <button
                onClick={() => setCommitteesSubTab('list')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  committeesSubTab === 'list'
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <List size={18} className="flex-shrink-0" />
                <span>Liste Committees</span>
              </button>
            </div>

            {/* Committees Sub-tab Content */}
            <div className="p-6">
              {committeesSubTab === 'new' ? (
                <NewCommittee 
                  committee={editingCommittee}
                  onSuccess={handleCommitteeSuccess}
                  onClose={handleCommitteeClose}
                />
              ) : (
                <CommitteesList 
                  onEdit={handleEditCommittee}
                  onDelete={() => setCommitteesRefreshTrigger(prev => prev + 1)}
                  refreshTrigger={committeesRefreshTrigger}
                />
              )}
            </div>
          </div>
        )}

        {/* Membres Tab Content */}
        {mainTab === 'membres' && (
          <div>
            {/* Sub-tabs for Membres */}
            <div className="flex w-full border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setMembresSubTab('new');
                  setShowMemberForm(false);
                  setEditingMember(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  membresSubTab === 'new'
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <UserPlus size={18} className="flex-shrink-0" />
                <span>New Membre</span>
              </button>
              <button
                onClick={() => {
                  setMembresSubTab('list');
                  setShowMemberForm(false);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  membresSubTab === 'list'
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <List size={18} className="flex-shrink-0" />
                <span>Liste Membres</span>
              </button>
            </div>

            {/* Membres Sub-tab Content */}
            <div className="p-6">
              {membresSubTab === 'new' ? (
                <div>
                  {!showMemberForm && !showParticipantSearch ? (
                    <div className="text-center py-12">
                      <UserPlus size={48} className="mx-auto mb-4 text-slate-300" />
                      <p className="text-slate-500 mb-4">Click the button below to add a new member</p>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setShowMemberForm(true);
                            setEditingMember(null);
                            setShowParticipantSearch(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <UserPlus size={18} />
                          Add New Member
                        </button>
                        <button
                          onClick={() => {
                            setShowParticipantSearch(true);
                            setShowMemberForm(false);
                            setEditingMember(null);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                        >
                          <Search size={18} />
                          Find in Database
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <MemberForm
                        member={editingMember}
                        inline={true}
                        showParticipantSearch={showParticipantSearch}
                        onClose={() => {
                          setShowMemberForm(false);
                          setEditingMember(null);
                          setShowParticipantSearch(false);
                        }}
                        onSuccess={() => {
                          setShowMemberForm(false);
                          setEditingMember(null);
                          setShowParticipantSearch(false);
                          setMembresSubTab('list');
                        }}
                        onParticipantSelect={() => {
                          setShowParticipantSearch(false);
                          setShowMemberForm(true);
                        }}
                      />
                    </>
                  )}
                </div>
              ) : (
                <MembersList 
                  onEdit={(member) => {
                    setEditingMember(member);
                    setShowMemberForm(true);
                    setMembresSubTab('new');
                  }}
                  onDelete={() => {}}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Member Form Modal - Only show when not in new tab inline view */}
      {showMemberForm && membresSubTab !== 'new' && (
        <MemberForm
          member={editingMember}
          onClose={handleFormClose}
          onSuccess={() => {
            handleFormClose();
            setMembresSubTab('list');
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
