import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, Building, Globe, Edit, Trash2, Loader2, ExternalLink, ChevronDown, ChevronUp, MapPin, GraduationCap, Link as LinkIcon, User, Award, Send } from 'lucide-react';
import { ReviewCommitteeMember } from '../../../../types';
import { deleteCommitteeMember, getCommitteeMembers } from '../../../../services/committeeMemberService';
import { useAuth } from '../../../../hooks/useAuth';
import InvitationEmailModal from './InvitationEmailModal';

interface MembersListProps {
  onEdit: (member: ReviewCommitteeMember) => void;
  onDelete: () => void;
}

const MembersList: React.FC<MembersListProps> = ({ onEdit, onDelete }) => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<ReviewCommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentUser) {
      loadMembers(currentUser.id);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadMembers = async (userId: string) => {
    try {
      setLoading(true);
      const membersList = await getCommitteeMembers(userId);
      setMembers(membersList);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (member: ReviewCommitteeMember) => {
    if (!window.confirm(`Are you sure you want to delete ${member.firstName} ${member.lastName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(member.id);
      await deleteCommitteeMember(member.id);
      if (currentUser) {
        await loadMembers(currentUser);
      }
      onDelete();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4">Loading members...</p>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center py-12 text-slate-400">
          <Users size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">No committee members</p>
          <p className="text-sm">Add your first committee member to get started</p>
        </div>
      </div>
    );
  }

  const toggleExpand = (memberId: string) => {
    if (!bulkSelectionMode) {
      setExpandedMemberId(expandedMemberId === memberId ? null : memberId);
    }
  };

  const handleSingleInvitation = (memberId: string) => {
    setSelectedMemberIds([memberId]);
    setShowInvitationModal(true);
  };

  const handleBulkInvitation = () => {
    if (bulkSelectedIds.size === 0) {
      alert('Please select at least one member to send invitations');
      return;
    }
    setSelectedMemberIds(Array.from(bulkSelectedIds));
    setShowInvitationModal(true);
  };

  const toggleBulkSelection = (memberId: string) => {
    const newSet = new Set(bulkSelectedIds);
    if (newSet.has(memberId)) {
      newSet.delete(memberId);
    } else {
      newSet.add(memberId);
    }
    setBulkSelectedIds(newSet);
  };

  const selectAll = () => {
    if (bulkSelectedIds.size === members.length) {
      setBulkSelectedIds(new Set());
    } else {
      setBulkSelectedIds(new Set(members.map(m => m.id)));
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Committee Members ({members.length})
            </h3>
            <div className="flex items-center gap-2">
              {bulkSelectionMode ? (
                <>
                  <button
                    onClick={selectAll}
                    className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    {bulkSelectedIds.size === members.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={handleBulkInvitation}
                    disabled={bulkSelectedIds.size === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                    Send Invitations ({bulkSelectedIds.size})
                  </button>
                  <button
                    onClick={() => {
                      setBulkSelectionMode(false);
                      setBulkSelectedIds(new Set());
                    }}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setBulkSelectionMode(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Send size={16} />
                  Bulk Invitation
                </button>
              )}
            </div>
          </div>
        </div>
      
      <div className="divide-y divide-slate-200">
        {members.map((member) => {
          const isExpanded = expandedMemberId === member.id;
          const hasAffiliation = member.affiliation.institution || member.affiliation.university || member.affiliation.organization;
          
          return (
            <div key={member.id} className="transition-all">
              {/* Collapsed Row */}
              <div
                onClick={() => !bulkSelectionMode && toggleExpand(member.id)}
                className={`px-6 py-4 hover:bg-slate-50 transition-colors ${bulkSelectionMode ? '' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {bulkSelectionMode && (
                      <input
                        type="checkbox"
                        checked={bulkSelectedIds.has(member.id)}
                        onChange={() => toggleBulkSelection(member.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                    )}
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="text-indigo-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-semibold text-slate-900 truncate">
                          {member.title && `${member.title} `}
                          {member.firstName} {member.lastName}
                        </h4>
                        {member.gender && (
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                            {member.gender}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail size={14} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={14} className="text-slate-400 flex-shrink-0" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        {hasAffiliation && (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Building size={14} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate">
                              {member.affiliation.institution || member.affiliation.university || member.affiliation.organization}
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-slate-400">ID: {member.committeeMemberId}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {!bulkSelectionMode && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleInvitation(member.id);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Send invitation email"
                        >
                          <Send size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(member);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit member"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(member);
                          }}
                          disabled={deletingId === member.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete member"
                        >
                          {deletingId === member.id ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                        <div className="p-2 text-slate-400">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-6 py-5 bg-slate-50 border-t border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <User size={18} className="text-indigo-600" />
                        <h5 className="font-semibold text-slate-900">Personal Information</h5>
                      </div>
                      <div className="space-y-2 pl-6">
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-slate-500 min-w-[100px]">Full Name:</span>
                          <span className="text-slate-900 font-medium">
                            {member.title && `${member.title} `}
                            {member.firstName} {member.lastName}
                          </span>
                        </div>
                        {member.gender && (
                          <div className="flex items-start gap-2 text-sm">
                            <span className="text-slate-500 min-w-[100px]">Gender:</span>
                            <span className="text-slate-900">{member.gender}</span>
                          </div>
                        )}
                        {member.nationality && (
                          <div className="flex items-start gap-2 text-sm">
                            <span className="text-slate-500 min-w-[100px]">Nationality:</span>
                            <span className="text-slate-900">{member.nationality}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-sm">
                          <span className="text-slate-500 min-w-[100px]">Member ID:</span>
                          <span className="text-slate-900 font-mono text-xs">{member.committeeMemberId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Mail size={18} className="text-indigo-600" />
                        <h5 className="font-semibold text-slate-900">Contact Information</h5>
                      </div>
                      <div className="space-y-2 pl-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-slate-400" />
                          <a href={`mailto:${member.email}`} className="text-indigo-600 hover:underline">
                            {member.email}
                          </a>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={14} className="text-slate-400" />
                            <span className="text-slate-900">{member.phone}</span>
                          </div>
                        )}
                        {member.address && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-900">{member.address}</span>
                          </div>
                        )}
                        {member.preferredLanguage && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe size={14} className="text-slate-400" />
                            <span className="text-slate-900">Preferred Languages: {member.preferredLanguage}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Affiliation */}
                    {(member.affiliation.institution || member.affiliation.university || member.affiliation.organization || member.affiliation.department || member.affiliation.position || member.affiliation.country) && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Building size={18} className="text-indigo-600" />
                          <h5 className="font-semibold text-slate-900">Affiliation</h5>
                        </div>
                        <div className="space-y-2 pl-6">
                          {member.affiliation.institution && (
                            <div className="text-sm">
                              <span className="text-slate-500">Institution: </span>
                              <span className="text-slate-900 font-medium">{member.affiliation.institution}</span>
                            </div>
                          )}
                          {member.affiliation.university && !member.affiliation.institution && (
                            <div className="text-sm">
                              <span className="text-slate-500">University: </span>
                              <span className="text-slate-900 font-medium">{member.affiliation.university}</span>
                            </div>
                          )}
                          {member.affiliation.organization && !member.affiliation.institution && !member.affiliation.university && (
                            <div className="text-sm">
                              <span className="text-slate-500">Organization: </span>
                              <span className="text-slate-900 font-medium">{member.affiliation.organization}</span>
                            </div>
                          )}
                          {member.affiliation.department && (
                            <div className="text-sm">
                              <span className="text-slate-500">Department: </span>
                              <span className="text-slate-900">{member.affiliation.department}</span>
                            </div>
                          )}
                          {member.affiliation.faculty && (
                            <div className="text-sm">
                              <span className="text-slate-500">Faculty: </span>
                              <span className="text-slate-900">{member.affiliation.faculty}</span>
                            </div>
                          )}
                          {member.affiliation.position && (
                            <div className="text-sm">
                              <span className="text-slate-500">Position: </span>
                              <span className="text-slate-900 font-medium">{member.affiliation.position}</span>
                            </div>
                          )}
                          {member.affiliation.country && (
                            <div className="text-sm">
                              <span className="text-slate-500">Country: </span>
                              <span className="text-slate-900">{member.affiliation.country}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Research Domains */}
                    {member.researchDomains && member.researchDomains.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                          <GraduationCap size={18} className="text-indigo-600" />
                          <h5 className="font-semibold text-slate-900">Research Domains</h5>
                        </div>
                        <div className="flex flex-wrap gap-2 pl-6">
                          {member.researchDomains.map((domain, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                            >
                              {domain}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Identifiers */}
                    {(member.identifiers.orcidId || member.identifiers.googleScholar || member.identifiers.researchGate || (member.identifiers.otherLinks && member.identifiers.otherLinks.length > 0)) && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                          <LinkIcon size={18} className="text-indigo-600" />
                          <h5 className="font-semibold text-slate-900">Identifiers & Links</h5>
                        </div>
                        <div className="space-y-2 pl-6">
                          {member.identifiers.orcidId && (
                            <a
                              href={`https://orcid.org/${member.identifiers.orcidId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                              <Award size={14} />
                              ORCID: {member.identifiers.orcidId}
                              <ExternalLink size={12} />
                            </a>
                          )}
                          {member.identifiers.googleScholar && (
                            <a
                              href={member.identifiers.googleScholar}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                              <GraduationCap size={14} />
                              Google Scholar
                              <ExternalLink size={12} />
                            </a>
                          )}
                          {member.identifiers.researchGate && (
                            <a
                              href={member.identifiers.researchGate}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                              <LinkIcon size={14} />
                              ResearchGate
                              <ExternalLink size={12} />
                            </a>
                          )}
                          {member.identifiers.otherLinks?.map((link, index) => (
                            <a
                              key={index}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 hover:underline truncate"
                            >
                              <LinkIcon size={14} />
                              Other Link {index + 1}
                              <ExternalLink size={12} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* Invitation Email Modal */}
    <InvitationEmailModal
      isOpen={showInvitationModal}
      onClose={() => {
        setShowInvitationModal(false);
        setSelectedMemberIds([]);
        setBulkSelectionMode(false);
        setBulkSelectedIds(new Set());
      }}
      members={Array.isArray(members) ? members : []}
      selectedMemberIds={Array.isArray(selectedMemberIds) ? selectedMemberIds : []}
    />
    </>
  );
};

export default MembersList;

