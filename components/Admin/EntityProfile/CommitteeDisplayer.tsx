import React, { useState, useEffect } from 'react';
import { Users, Loader2, AlertCircle, ChevronDown, ChevronRight, User, ChevronLeft } from 'lucide-react';
import { getCommittees } from '../../../services/committeeService';
import { getCommitteeMembersByIds } from '../../../services/committeeMemberService';
import { Committee, ReviewCommitteeMember } from '../../../types';

interface CommitteeDisplayerProps {
  userId: string;
}

const CommitteeDisplayer: React.FC<CommitteeDisplayerProps> = ({ userId }) => {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [membersMap, setMembersMap] = useState<Map<string, ReviewCommitteeMember>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCommittees, setExpandedCommittees] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadCommittees = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getCommittees(userId);
        // Ensure fieldsOfIntervention is properly structured
        const normalizedCommittees = data.map(committee => ({
          ...committee,
          fieldsOfIntervention: Array.isArray(committee.fieldsOfIntervention) 
            ? committee.fieldsOfIntervention 
            : []
        }));
        setCommittees(normalizedCommittees);
        setCurrentIndex(0); // Start with the first committee

        // Collect all member IDs from all fields of intervention
        const allMemberIds = new Set<string>();
        normalizedCommittees.forEach(committee => {
          committee.fieldsOfIntervention.forEach(field => {
            if (field.memberIds && Array.isArray(field.memberIds)) {
              field.memberIds.forEach(id => allMemberIds.add(id));
            }
          });
        });

        // Fetch all members
        if (allMemberIds.size > 0) {
          try {
            const members = await getCommitteeMembersByIds(Array.from(allMemberIds));
            const membersMap = new Map<string, ReviewCommitteeMember>();
            members.forEach(member => {
              membersMap.set(member.id, member);
            });
            setMembersMap(membersMap);
          } catch (memberError) {
            console.error('Error loading committee members:', memberError);
            // Don't fail the whole component if members can't be loaded
            setMembersMap(new Map());
          }
        } else {
          setMembersMap(new Map());
        }
      } catch (err: any) {
        console.error('Error loading committees:', err);
        setError(err.message || 'Failed to load committees');
        setCommittees([]);
        setMembersMap(new Map());
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadCommittees();
    } else {
      setLoading(false);
      setCommittees([]);
      setMembersMap(new Map());
    }
  }, [userId]);

  const toggleCommittee = (committeeId: string) => {
    setExpandedCommittees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(committeeId)) {
        newSet.delete(committeeId);
      } else {
        newSet.add(committeeId);
      }
      return newSet;
    });
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : committees.length - 1));
    // Close expanded state when navigating
    setExpandedCommittees(new Set());
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < committees.length - 1 ? prev + 1 : 0));
    // Close expanded state when navigating
    setExpandedCommittees(new Set());
  };

  const goToCommittee = (index: number) => {
    setCurrentIndex(index);
    // Close expanded state when navigating
    setExpandedCommittees(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-indigo-600" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="text-red-600" size={20} />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (committees.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Users className="mx-auto mb-2 text-slate-400" size={32} />
        <p>No committees found</p>
      </div>
    );
  }

  const currentCommittee = committees[currentIndex];
  const isExpanded = expandedCommittees.has(currentCommittee.id);
  // Ensure fieldsOfIntervention is an array
  const fields = Array.isArray(currentCommittee.fieldsOfIntervention) 
    ? currentCommittee.fieldsOfIntervention 
    : [];
  const hasFields = fields.length > 0;

  return (
    <div className="relative">
      {/* Committee Card */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        <button
          onClick={() => toggleCommittee(currentCommittee.id)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          disabled={!hasFields}
        >
          <div className="flex items-center gap-3 flex-1 text-left">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="text-indigo-600" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">{currentCommittee.name || 'Unnamed Committee'}</h3>
              {currentCommittee.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{currentCommittee.description}</p>
              )}
              {hasFields && (
                <p className="text-xs text-indigo-600 mt-1">
                  {fields.length} field{fields.length !== 1 ? 's' : ''} of intervention
                </p>
              )}
              {!hasFields && (
                <p className="text-xs text-slate-400 mt-1">No fields of intervention</p>
              )}
            </div>
          </div>
          {hasFields && (
            <div className="ml-4 flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="text-slate-400" size={20} />
              ) : (
                <ChevronRight className="text-slate-400" size={20} />
              )}
            </div>
          )}
        </button>

        {isExpanded && hasFields && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Fields of Intervention</h4>
            <div className="space-y-3">
              {fields.map((field) => {
                const fieldMembers = field.memberIds && Array.isArray(field.memberIds)
                  ? field.memberIds
                      .map(id => membersMap.get(id))
                      .filter((m): m is ReviewCommitteeMember => m !== undefined)
                  : [];

                return (
                  <div
                    key={field.id || `field-${field.name}`}
                    className="bg-white rounded-lg p-4 border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-slate-900">{field.name || 'Unnamed Field'}</h5>
                      {field.memberIds && Array.isArray(field.memberIds) && field.memberIds.length > 0 && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {field.memberIds.length} member{field.memberIds.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {fieldMembers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs font-medium text-slate-500 mb-2">Members:</p>
                        <div className="space-y-1.5">
                          {fieldMembers.map((member) => {
                            const fullName = [member.title, member.firstName, member.lastName]
                              .filter(Boolean)
                              .join(' ') || member.email;
                            return (
                              <div
                                key={member.id}
                                className="flex items-center gap-2 text-sm text-slate-700"
                              >
                                <User className="text-slate-400" size={14} />
                                <span>{fullName}</span>
                                {member.affiliation?.institution && (
                                  <span className="text-xs text-slate-400">
                                    • {member.affiliation.institution}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {committees.length > 1 && (
        <>
          {/* Previous/Next Buttons */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={goToPrevious}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous committee"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Committee Indicators/Dots */}
            <div className="flex items-center gap-2">
              {committees.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToCommittee(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-indigo-600'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to committee ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={goToNext}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next committee"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Committee Counter */}
          <div className="text-center mt-2 text-xs text-slate-500">
            {currentIndex + 1} of {committees.length}
          </div>
        </>
      )}
    </div>
  );
};

export default CommitteeDisplayer;
