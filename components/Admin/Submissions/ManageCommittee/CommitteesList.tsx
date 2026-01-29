import React, { useState, useEffect, useMemo } from 'react';
import { Users, FileText, Edit, Trash2, Loader2, AlertCircle, X, UserCircle } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { getCommittees, deleteCommittee, updateCommittee } from '../../../../services/committeeService';
import { getCommitteeMembers } from '../../../../services/committeeMemberService';
import { Committee, ReviewCommitteeMember } from '../../../../types';

interface CommitteesListProps {
  onEdit?: (committee: Committee) => void;
  onDelete?: () => void;
  refreshTrigger?: number; // Trigger refresh when this changes
}

const CommitteesList: React.FC<CommitteesListProps> = ({ onEdit, onDelete, refreshTrigger }) => {
  const { currentUser } = useAuth();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [allMembers, setAllMembers] = useState<ReviewCommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<{ committeeId: string; fieldId: string; memberId: string } | null>(null);
  const [error, setError] = useState('');

  // Create a map of member ID to member object for quick lookup
  const membersMap = useMemo(() => {
    const map = new Map<string, ReviewCommitteeMember>();
    allMembers.forEach(member => {
      map.set(member.id, member);
    });
    return map;
  }, [allMembers]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [currentUser, refreshTrigger]);

  const loadData = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Load committees and members in parallel
      const [committeesList, membersList] = await Promise.all([
        getCommittees(currentUser.id),
        getCommitteeMembers(currentUser.id)
      ]);
      
      setCommittees(committeesList);
      setAllMembers(membersList);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCommittees = async () => {
    if (!currentUser?.id) return;
    
    try {
      const committeesList = await getCommittees(currentUser.id);
      setCommittees(committeesList);
    } catch (err: any) {
      console.error('Error loading committees:', err);
      setError(err.message || 'Failed to load committees. Please try again.');
    }
  };

  const handleDelete = async (committee: Committee) => {
    if (!window.confirm(`Are you sure you want to delete "${committee.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(committee.id);
      await deleteCommittee(committee.id);
      await loadCommittees();
      if (onDelete) {
        onDelete();
      }
    } catch (err: any) {
      console.error('Error deleting committee:', err);
      alert(err.message || 'Failed to delete committee. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const calculateTotalMembers = (committee: Committee): number => {
    const memberIdSet = new Set<string>();
    committee.fieldsOfIntervention.forEach(field => {
      field.memberIds.forEach(id => memberIdSet.add(id));
    });
    return memberIdSet.size;
  };

  const getMemberName = (memberId: string): string => {
    const member = membersMap.get(memberId);
    if (!member) return 'Unknown Member';
    return `${member.title ? `${member.title} ` : ''}${member.firstName} ${member.lastName}`.trim();
  };

  const handleRemoveMemberFromField = async (
    committeeId: string,
    fieldId: string,
    memberId: string
  ) => {
    const member = membersMap.get(memberId);
    const memberName = member ? `${member.firstName} ${member.lastName}` : 'this member';
    
    if (!window.confirm(`Remove ${memberName} from this field?`)) {
      return;
    }

    try {
      setRemovingMemberId({ committeeId, fieldId, memberId });
      
      // Find the committee
      const committee = committees.find(c => c.id === committeeId);
      if (!committee) {
        throw new Error('Committee not found');
      }

      // Update the field to remove the member
      const updatedFields = committee.fieldsOfIntervention.map(field => {
        if (field.id === fieldId) {
          return {
            ...field,
            memberIds: field.memberIds.filter(id => id !== memberId)
          };
        }
        return field;
      });

      // Update the committee
      await updateCommittee(committeeId, {
        fieldsOfIntervention: updatedFields
      });

      // Update local state immediately for real-time update
      setCommittees(prevCommittees =>
        prevCommittees.map(c =>
          c.id === committeeId
            ? {
                ...c,
                fieldsOfIntervention: updatedFields,
                updatedAt: new Date()
              }
            : c
        )
      );
    } catch (err: any) {
      console.error('Error removing member from field:', err);
      alert(err.message || 'Failed to remove member. Please try again.');
      // Reload to sync with server
      await loadCommittees();
    } finally {
      setRemovingMemberId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4">Loading committees...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error loading committees</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadCommittees}
              className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (committees.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Users size={48} className="mx-auto mb-4 opacity-20" />
        <p className="font-medium">No committees</p>
        <p className="text-sm">Create your first committee to get started</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Committees List</h2>
        <span className="text-sm text-slate-500">
          {committees.length} committee{committees.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-4">
        {committees.map((committee) => {
          const totalMembers = calculateTotalMembers(committee);
          const totalFields = committee.fieldsOfIntervention.length;
          
          return (
            <div
              key={committee.id}
              className="bg-white border border-slate-200 rounded-lg p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{committee.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                      {totalFields} field{totalFields !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {committee.description && (
                    <p className="text-sm text-slate-600 mt-1 mb-3">{committee.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Users size={16} />
                      <span>{totalMembers} member{totalMembers !== 1 ? 's' : ''}</span>
                    </div>
                    {committee.fieldsOfIntervention.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <FileText size={16} />
                        <span>{totalFields} field{totalFields !== 1 ? 's' : ''} of intervention</span>
                      </div>
                    )}
                    <span className="text-xs text-slate-400">
                      Created: {new Date(committee.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Show fields of intervention with members */}
                  {committee.fieldsOfIntervention.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs font-medium text-slate-500 mb-3">Fields of Intervention:</p>
                      <div className={`grid gap-4 ${
                        committee.fieldsOfIntervention.length === 1 ? 'grid-cols-1' :
                        committee.fieldsOfIntervention.length === 2 ? 'grid-cols-2' :
                        committee.fieldsOfIntervention.length === 3 ? 'grid-cols-3' :
                        'grid-cols-4'
                      }`}>
                        {committee.fieldsOfIntervention.map((field, index) => {
                          const fieldMembers = field.memberIds
                            .map(id => membersMap.get(id))
                            .filter((m): m is ReviewCommitteeMember => m !== undefined);
                          
                          return (
                            <div
                              key={field.id || index}
                              className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <FileText size={14} className="text-indigo-600" />
                                  <span className="text-sm font-semibold text-slate-900">{field.name}</span>
                                  <span className="text-xs text-slate-500">
                                    ({field.memberIds.length} member{field.memberIds.length !== 1 ? 's' : ''})
                                  </span>
                                </div>
                              </div>
                              
                              {/* Members in this field */}
                              {fieldMembers.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {fieldMembers.map((member) => {
                                    const isRemoving = removingMemberId?.committeeId === committee.id &&
                                                      removingMemberId?.fieldId === field.id &&
                                                      removingMemberId?.memberId === member.id;
                                    
                                    return (
                                      <div
                                        key={member.id}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-indigo-200 rounded-md text-xs group hover:border-indigo-300 transition-colors"
                                      >
                                        <UserCircle size={14} className="text-indigo-600 flex-shrink-0" />
                                        <span className="font-medium text-slate-900">
                                          {member.title ? `${member.title} ` : ''}
                                          {member.firstName} {member.lastName}
                                        </span>
                                        <button
                                          onClick={() => handleRemoveMemberFromField(committee.id, field.id, member.id)}
                                          disabled={isRemoving}
                                          className="ml-1 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                          title="Remove member from field"
                                        >
                                          {isRemoving ? (
                                            <Loader2 className="animate-spin" size={12} />
                                          ) : (
                                            <X size={12} />
                                          )}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic mt-2">No members assigned to this field</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(committee)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit committee"
                    >
                      <Edit size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(committee)}
                    disabled={deletingId === committee.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete committee"
                  >
                    {deletingId === committee.id ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommitteesList;

