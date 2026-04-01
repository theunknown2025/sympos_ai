import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Send, 
  Paperclip, 
  X, 
  Users, 
  Trash2, 
  Edit2,
  Loader2,
  AlertCircle,
  FileText,
  Download,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { supabase, STORAGE_BUCKETS } from '../../../supabase';
import {
  createMessageGroup,
  getUserMessageGroups,
  updateMessageGroup,
  deleteMessageGroup,
  addGroupMember,
  getGroupMembers,
  removeGroupMember,
  getCommitteeMemberOptions,
  getRegistrationParticipantOptions,
  getSubmissionParticipantOptions,
  sendMessage,
  getGroupMessages,
  uploadMessageAttachment,
  markMessageAsRead,
} from '../../../services/messagingService';
import type {
  MessageGroup,
  MessageGroupMember,
  Message,
  ParticipantOption,
  MessageAttachment,
} from '../../../types';

const Messaging: React.FC = () => {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<MessageGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<MessageGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<MessageGroupMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Group creation/editing
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MessageGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  
  // Member selection
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [committeeOptions, setCommitteeOptions] = useState<ParticipantOption[]>([]);
  const [registrationOptions, setRegistrationOptions] = useState<ParticipantOption[]>([]);
  const [submissionOptions, setSubmissionOptions] = useState<ParticipantOption[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<ParticipantOption[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  
  // Message sending
  const [messageContent, setMessageContent] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageFiles, setMessageFiles] = useState<File[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadGroups();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupData();
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      setError('');
      const groupsData = await getUserMessageGroups(currentUser.id);
      setGroups(groupsData);
    } catch (err: any) {
      console.error('Error loading groups:', err);
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupData = async () => {
    if (!selectedGroup) return;
    
    try {
      const [membersData, messagesData] = await Promise.all([
        getGroupMembers(selectedGroup.id),
        getGroupMessages(selectedGroup.id),
      ]);
      setGroupMembers(membersData);
      setMessages(messagesData);
    } catch (err: any) {
      console.error('Error loading group data:', err);
      setError(err.message || 'Failed to load group data');
    }
  };

  const handleCreateGroup = async () => {
    if (!currentUser?.id || !groupName.trim()) return;
    
    try {
      setError('');
      if (editingGroup) {
        await updateMessageGroup(editingGroup.id, groupName, groupDescription);
      } else {
        await createMessageGroup(currentUser.id, groupName, groupDescription);
      }
      setShowGroupModal(false);
      setGroupName('');
      setGroupDescription('');
      setEditingGroup(null);
      await loadGroups();
    } catch (err: any) {
      console.error('Error creating/updating group:', err);
      setError(err.message || 'Failed to create/update group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? All messages will be deleted.')) return;
    
    try {
      await deleteMessageGroup(groupId);
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setGroupMembers([]);
        setMessages([]);
      }
      await loadGroups();
    } catch (err: any) {
      console.error('Error deleting group:', err);
      setError(err.message || 'Failed to delete group');
    }
  };

  const handleEditGroup = (group: MessageGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || '');
    setShowGroupModal(true);
  };

  const loadParticipantOptions = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoadingParticipants(true);
      const [committee, registrations, submissions] = await Promise.all([
        getCommitteeMemberOptions(currentUser.id),
        getRegistrationParticipantOptions(currentUser.id),
        getSubmissionParticipantOptions(currentUser.id),
      ]);
      setCommitteeOptions(committee);
      setRegistrationOptions(registrations);
      setSubmissionOptions(submissions);
    } catch (err: any) {
      console.error('Error loading participant options:', err);
      setError(err.message || 'Failed to load participants');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleOpenMemberModal = () => {
    setShowMemberModal(true);
    setSelectedParticipants([]);
    setSearchQuery('');
    loadParticipantOptions();
  };

  const handleAddMembers = async () => {
    if (!selectedGroup || selectedParticipants.length === 0) return;
    
    try {
      setError('');
      for (const participant of selectedParticipants) {
        await addGroupMember(
          selectedGroup.id,
          participant.type,
          participant.sourceId,
          participant.email,
          participant.name
        );
      }
      setShowMemberModal(false);
      setSelectedParticipants([]);
      await loadGroupData();
    } catch (err: any) {
      console.error('Error adding members:', err);
      setError(err.message || 'Failed to add members');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeGroupMember(memberId);
      await loadGroupData();
    } catch (err: any) {
      console.error('Error removing member:', err);
      setError(err.message || 'Failed to remove member');
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser?.id || !selectedGroup || !messageContent.trim()) return;
    
    try {
      setSendingMessage(true);
      setError('');
      
      // Send message
      const message = await sendMessage(
        currentUser.id,
        'admin',
        messageContent,
        messageSubject || undefined,
        selectedGroup.id
      );
      
      // Upload attachments
      if (messageFiles.length > 0) {
        for (const file of messageFiles) {
          await uploadMessageAttachment(message.id, file);
        }
      }
      
      setMessageContent('');
      setMessageSubject('');
      setMessageFiles([]);
      await loadGroupData();
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const allParticipants = [
    ...committeeOptions,
    ...registrationOptions,
    ...submissionOptions,
  ];

  const filteredParticipants = allParticipants.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleParticipantSelection = (participant: ParticipantOption) => {
    setSelectedParticipants(prev => {
      const exists = prev.find(p => p.id === participant.id && p.type === participant.type);
      if (exists) {
        return prev.filter(p => !(p.id === participant.id && p.type === participant.type));
      }
      return [...prev, participant];
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Groups Sidebar */}
        <div className="w-80 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Message Groups</h2>
              <button
                onClick={() => {
                  setEditingGroup(null);
                  setGroupName('');
                  setGroupDescription('');
                  setShowGroupModal(true);
                }}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {groups.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                <MessageSquare size={48} className="mx-auto mb-2 text-slate-300" />
                <p>No groups yet</p>
                <p className="text-sm">Create a group to start messaging</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {groups.map(group => (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedGroup?.id === group.id
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-slate-500 truncate mt-1">{group.description}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {group.memberCount || 0} members
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditGroup(group);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedGroup ? (
            <>
              {/* Group Header */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{selectedGroup.name}</h2>
                    {selectedGroup.description && (
                      <p className="text-sm text-slate-500 mt-1">{selectedGroup.description}</p>
                    )}
                  </div>
                  <button
                    onClick={handleOpenMemberModal}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Users size={16} />
                    Add Members
                  </button>
                </div>
                
                {/* Members List */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {groupMembers.map(member => (
                    <div
                      key={member.id}
                      className="px-3 py-1 bg-slate-100 rounded-full text-sm flex items-center gap-2"
                    >
                      <span className="text-slate-700">{member.memberName || member.memberEmail}</span>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">
                    <MessageSquare size={48} className="mx-auto mb-2 text-slate-300" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start a conversation</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.senderType === 'admin'
                          ? 'bg-indigo-50 border border-indigo-200 ml-auto max-w-2xl'
                          : 'bg-slate-50 border border-slate-200 max-w-2xl'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-slate-900">
                            {message.senderType === 'admin' ? 'You' : message.senderName || 'Participant'}
                          </p>
                          {message.subject && (
                            <p className="text-sm font-medium text-slate-700 mt-1">{message.subject}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{message.content}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.attachments.map(att => (
                            <a
                              key={att.id}
                              href={(() => {
                                // Extract path relative to bucket (remove bucket name prefix)
                                let filePath = att.filePath;
                                if (filePath.startsWith('message-attachments/')) {
                                  filePath = filePath.replace('message-attachments/', '');
                                }
                                if (filePath.startsWith(STORAGE_BUCKETS.MESSAGE_ATTACHMENTS + '/')) {
                                  filePath = filePath.replace(STORAGE_BUCKETS.MESSAGE_ATTACHMENTS + '/', '');
                                }
                                const { data } = supabase.storage
                                  .from(STORAGE_BUCKETS.MESSAGE_ATTACHMENTS)
                                  .getPublicUrl(filePath);
                                return data.publicUrl;
                              })()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 hover:bg-slate-50"
                            >
                              <FileText size={16} className="text-indigo-600" />
                              <span className="text-sm text-slate-700">{att.fileName}</span>
                              <Download size={14} className="text-slate-400 ml-auto" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-200">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Subject (optional)"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    placeholder="Type your message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  {messageFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {messageFiles.map((file, index) => (
                        <div
                          key={index}
                          className="px-3 py-1 bg-slate-100 rounded-full text-sm flex items-center gap-2"
                        >
                          <FileText size={14} />
                          <span className="text-slate-700">{file.name}</span>
                          <button
                            onClick={() => setMessageFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setMessageFiles(prev => [...prev, ...files]);
                        }}
                        className="hidden"
                      />
                      <Paperclip className="text-slate-400 hover:text-indigo-600" size={20} />
                    </label>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageContent.trim() || sendingMessage}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {sendingMessage ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Send size={16} />
                      )}
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">Select a group to view messages</p>
                <p className="text-sm">Or create a new group to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editingGroup ? 'Edit Group' : 'Create New Group'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Enter group description (optional)"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setEditingGroup(null);
                    setGroupName('');
                    setGroupDescription('');
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingGroup ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Members to Group</h3>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {loadingParticipants ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto mb-4">
                <div className="space-y-2">
                  {filteredParticipants.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No participants found</p>
                  ) : (
                    filteredParticipants.map(participant => {
                      const isSelected = selectedParticipants.some(
                        p => p.id === participant.id && p.type === participant.type
                      );
                      return (
                        <div
                          key={`${participant.type}-${participant.id}`}
                          onClick={() => toggleParticipantSelection(participant)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-200'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{participant.name}</p>
                              <p className="text-sm text-slate-500">{participant.email}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {participant.type === 'committee_member' && 'Committee Member'}
                                {participant.type === 'registration_participant' && 'Registration Participant'}
                                {participant.type === 'submission_participant' && 'Submission Participant'}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="text-indigo-600" size={20} />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                {selectedParticipants.length} selected
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMemberModal(false);
                    setSelectedParticipants([]);
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMembers}
                  disabled={selectedParticipants.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {selectedParticipants.length > 0 && `(${selectedParticipants.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messaging;
