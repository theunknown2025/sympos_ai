import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, Plus, X, Users, Search, GripVertical, UserCircle, CheckCircle2, Crown } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { getCommitteeMembers } from '../../../../services/committeeMemberService';
import { saveCommittee, updateCommittee } from '../../../../services/committeeService';
import { ReviewCommitteeMember, Committee, FieldOfIntervention } from '../../../../types';

interface NewCommitteeProps {
  committee?: Committee | null;
  onSuccess?: () => void;
  onClose?: () => void;
}

const NewCommittee: React.FC<NewCommitteeProps> = ({ committee, onSuccess, onClose }) => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FieldOfIntervention[]>([]);
  const [availableMembers, setAvailableMembers] = useState<ReviewCommitteeMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<ReviewCommitteeMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [draggedMember, setDraggedMember] = useState<ReviewCommitteeMember | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    fieldId: string;
    zone: 'chair' | 'members';
  } | null>(null);

  // Initialize form if editing
  useEffect(() => {
    if (committee) {
      setName(committee.name);
      setDescription(committee.description || '');
      setFields(committee.fieldsOfIntervention.map(field => ({
        id: field.id,
        name: field.name,
        memberIds: field.memberIds,
        chairMemberId: field.chairMemberId ?? null
      })));
    }
  }, [committee]);

  // Load committee members when component mounts
  useEffect(() => {
    if (currentUser?.id) {
      loadMembers();
    }
  }, [currentUser]);

  const loadMembers = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoadingMembers(true);
      const members = await getCommitteeMembers(currentUser.id);
      setAvailableMembers(members);
      setFilteredMembers(members);
    } catch (err: any) {
      console.error('Error loading members:', err);
      setError('Failed to load committee members. Please try again.');
    } finally {
      setLoadingMembers(false);
    }
  };

  // Filter members based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(availableMembers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = availableMembers.filter(member => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      const email = member.email?.toLowerCase() || '';
      const title = member.title?.toLowerCase() || '';
      const affiliation = member.affiliation?.institution?.toLowerCase() || '';
      
      return fullName.includes(query) || 
             email.includes(query) || 
             title.includes(query) ||
             affiliation.includes(query);
    });
    setFilteredMembers(filtered);
  }, [searchQuery, availableMembers]);

  const addField = () => {
    const newField: FieldOfIntervention = {
      id: Date.now().toString(),
      name: '',
      memberIds: [],
      chairMemberId: null
    };
    setFields([...fields, newField]);
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const updateFieldName = (fieldId: string, name: string) => {
    setFields(fields.map(f => 
      f.id === fieldId ? { ...f, name } : f
    ));
  };

  const toggleMemberInField = (fieldId: string, memberId: string) => {
    setFields(fields.map(f => {
      if (f.id !== fieldId) return f;

      const isSelected = f.memberIds.includes(memberId);
      const nextIds = isSelected
        ? f.memberIds.filter(id => id !== memberId)
        : [...f.memberIds, memberId];
      const nextChair =
        isSelected && f.chairMemberId === memberId ? null : f.chairMemberId;
      return {
        ...f,
        memberIds: nextIds,
        chairMemberId: nextChair
      };
    }));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, member: ReviewCommitteeMember) => {
    setDraggedMember(member);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', member.id);
  };

  const handleDragOver = (
    e: React.DragEvent,
    fieldId: string,
    zone: 'chair' | 'members'
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget({ fieldId, zone });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setDragOverTarget(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    fieldId: string,
    zone: 'chair' | 'members'
  ) => {
    e.preventDefault();
    setDragOverTarget(null);

    if (!draggedMember) return;

    setFields(prev =>
      prev.map(f => {
        if (f.id !== fieldId) return f;

        if (zone === 'chair') {
          const id = draggedMember.id;
          const memberIds = f.memberIds.includes(id)
            ? f.memberIds
            : [...f.memberIds, id];
          return { ...f, chairMemberId: id, memberIds };
        }

        if (!f.memberIds.includes(draggedMember.id)) {
          return {
            ...f,
            memberIds: [...f.memberIds, draggedMember.id]
          };
        }
        return f;
      })
    );

    setDraggedMember(null);
  };

  const removeChairFromField = (fieldId: string) => {
    setFields(fields.map(f => (f.id === fieldId ? { ...f, chairMemberId: null } : f)));
  };

  const removeMemberFromField = (fieldId: string, memberId: string) => {
    setFields(fields.map(f => {
      if (f.id !== fieldId) return f;
      const nextChair = f.chairMemberId === memberId ? null : f.chairMemberId;
      return {
        ...f,
        memberIds: f.memberIds.filter(id => id !== memberId),
        chairMemberId: nextChair
      };
    }));
  };

  const getMemberById = (memberId: string) => {
    return availableMembers.find(m => m.id === memberId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Committee name is required');
      return;
    }

    // Validate fields
    const emptyFields = fields.filter(f => !f.name.trim());
    if (emptyFields.length > 0) {
      setError('All fields of intervention must have a name');
      return;
    }

    const fieldsMissingChair = fields.filter(
      f => f.name.trim() && !f.chairMemberId
    );
    if (fieldsMissingChair.length > 0) {
      setError(
        'Each field of intervention must have a sub-committee chair. Drag a member from the list onto the chair slot.'
      );
      return;
    }

    if (!currentUser?.id) {
      setError('You must be logged in to save committees');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      const committeeData = {
        name: name.trim(),
        description: description.trim() || undefined,
        fieldsOfIntervention: fields.map(f => {
          const chairId = f.chairMemberId ?? null;
          const memberIds =
            chairId && !f.memberIds.includes(chairId)
              ? [...f.memberIds, chairId]
              : f.memberIds;
          return {
            id: f.id,
            name: f.name.trim(),
            memberIds,
            chairMemberId: chairId
          };
        })
      };

      if (committee) {
        // Update existing committee
        await updateCommittee(committee.id, committeeData);
        setSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          if (onClose) onClose();
        }, 1500);
      } else {
        // Create new committee
        await saveCommittee(currentUser.id, committeeData);
        setSuccess(true);
        
        // Reset form
        setName('');
        setDescription('');
        setFields([]);
        
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error saving committee:', err);
      setError(err.message || 'Failed to save committee. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        {committee ? 'Edit Committee' : 'Create New Committee'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
            <CheckCircle2 size={20} />
            <span>Committee {committee ? 'updated' : 'created'} successfully!</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Committee Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Technical Review Committee"
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the purpose and scope of this committee..."
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Fields of Intervention Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Fields of Intervention
            </label>
            <button
              type="button"
              onClick={addField}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus size={16} />
              Add Field
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
              <Users size={32} className="mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-500">No fields of intervention added yet</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add Field" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="border border-slate-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Field Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateFieldName(field.id, e.target.value)}
                        placeholder="e.g., Computer Science, Mathematics, etc."
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="mt-7 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove field"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Sub-committee chair: exactly one per field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Crown size={16} className="text-amber-600" />
                      Sub-committee chair
                      <span className="text-red-500">*</span>
                    </label>
                    <div
                      onDragOver={(e) => handleDragOver(e, field.id, 'chair')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, field.id, 'chair')}
                      className={`min-h-[88px] p-3 border-2 border-dashed rounded-lg transition-colors ${
                        dragOverTarget?.fieldId === field.id &&
                        dragOverTarget?.zone === 'chair'
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-amber-200 bg-amber-50/40'
                      }`}
                    >
                      {field.chairMemberId ? (
                        (() => {
                          const chair = getMemberById(field.chairMemberId);
                          if (!chair) {
                            return (
                              <p className="text-sm text-amber-800">
                                Unknown member — remove and assign another chair.
                              </p>
                            );
                          }
                          return (
                            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm w-fit">
                              <Crown size={16} className="text-amber-600 flex-shrink-0" />
                              <span className="font-medium text-slate-900">
                                {chair.title ? `${chair.title} ` : ''}
                                {chair.firstName} {chair.lastName}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeChairFromField(field.id)}
                                className="ml-1 text-slate-400 hover:text-red-600 transition-colors"
                                title="Remove chair (member stays in members list if added there)"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-center py-4 text-slate-500">
                          <Crown size={22} className="mx-auto mb-2 text-amber-500/70" />
                          <p className="text-sm">Drag one member here to set the chair</p>
                          <p className="text-xs text-slate-400 mt-1">Only one chair per sub-committee</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drop zone: other members */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Members in this field
                    </label>
                    <div
                      onDragOver={(e) => handleDragOver(e, field.id, 'members')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, field.id, 'members')}
                      className={`min-h-[120px] p-3 border-2 border-dashed rounded-lg transition-colors ${
                        dragOverTarget?.fieldId === field.id &&
                        dragOverTarget?.zone === 'members'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-300 bg-slate-50'
                      }`}
                    >
                      {field.memberIds.filter((id) => id !== field.chairMemberId).length ===
                      0 ? (
                        <div className="text-center py-6 text-slate-400">
                          <Users size={24} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Drag more members here (optional)</p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {field.memberIds
                            .filter((memberId) => memberId !== field.chairMemberId)
                            .map((memberId) => {
                              const member = getMemberById(memberId);
                              if (!member) return null;
                              return (
                                <div
                                  key={memberId}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm"
                                >
                                  <UserCircle size={16} className="text-indigo-600" />
                                  <span className="font-medium text-slate-900">
                                    {member.title ? `${member.title} ` : ''}
                                    {member.firstName} {member.lastName}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeMemberFromField(field.id, memberId)}
                                    className="ml-1 text-slate-400 hover:text-red-600 transition-colors"
                                    title="Remove member"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving || success}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {committee ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {committee ? 'Update Committee' : 'Create Committee'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Members List */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-lg p-4 sticky top-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-indigo-600" />
              Available Members
            </h3>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Members List */}
            {loadingMembers ? (
              <div className="flex items-center justify-center gap-2 text-slate-500 py-8">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-sm">Loading members...</span>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {searchQuery ? 'No members found' : 'No members available'}
                </p>
                {!searchQuery && (
                  <p className="text-xs mt-1">Add members in the "Membres" tab first</p>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredMembers.map((member) => {
                  const isInAnyField = fields.some(f => f.memberIds.includes(member.id));
                  return (
                    <div
                      key={member.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, member)}
                      onDragEnd={() => {
                        setDraggedMember(null);
                        setDragOverTarget(null);
                      }}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-move transition-all hover:shadow-md ${
                        draggedMember?.id === member.id
                          ? 'opacity-50 border-indigo-300 bg-indigo-50'
                          : 'border-slate-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <GripVertical size={18} className="text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {member.title ? `${member.title} ` : ''}
                          {member.firstName} {member.lastName}
                        </p>
                        {member.email && (
                          <p className="text-xs text-slate-500 truncate">
                            {member.email}
                          </p>
                        )}
                        {member.affiliation?.institution && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {member.affiliation.institution}
                          </p>
                        )}
                      </div>
                      {isInAnyField && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full" title="Member assigned to a field" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {filteredMembers.length > 0 && (
              <p className="text-xs text-slate-500 mt-4 text-center">
                {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCommittee;

