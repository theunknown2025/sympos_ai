import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, UserPlus, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { getUserSubmissions } from '../../../../services/registrationSubmissionService';
import { FormSubmission } from '../../../../types';

interface ParticipantSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (participant: FormSubmission) => void;
  onSelectMultiple?: (participants: FormSubmission[]) => void;
  allowMultiple?: boolean;
}

const ParticipantSearchModal: React.FC<ParticipantSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  allowMultiple = false,
}) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [participants, setParticipants] = useState<FormSubmission[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && currentUser) {
      loadParticipants();
    } else {
      setSearchQuery('');
      setSelectedIds(new Set());
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = participants.filter(p => {
        const name = p.generalInfo?.name || '';
        const email = p.generalInfo?.email || '';
        const organization = p.generalInfo?.organization || '';
        const submittedBy = p.submittedBy || '';
        
        return (
          name.toLowerCase().includes(query) ||
          email.toLowerCase().includes(query) ||
          organization.toLowerCase().includes(query) ||
          submittedBy.toLowerCase().includes(query)
        );
      });
      setFilteredParticipants(filtered);
    } else {
      setFilteredParticipants(participants);
    }
  }, [searchQuery, participants]);

  const loadParticipants = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      setError('');
      const submissions = await getUserSubmissions(currentUser.id);
      // Filter to get unique participants (by email)
      const uniqueParticipants = new Map<string, FormSubmission>();
      submissions.forEach(sub => {
        const email = sub.generalInfo?.email || sub.submittedBy || '';
        if (email && !uniqueParticipants.has(email)) {
          uniqueParticipants.set(email, sub);
        }
      });
      setParticipants(Array.from(uniqueParticipants.values()));
      setFilteredParticipants(Array.from(uniqueParticipants.values()));
    } catch (err: any) {
      console.error('Error loading participants:', err);
      setError(err.message || 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (participant: FormSubmission) => {
    if (allowMultiple && onSelectMultiple) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(participant.id)) {
        newSelected.delete(participant.id);
      } else {
        newSelected.add(participant.id);
      }
      setSelectedIds(newSelected);
    } else {
      onSelect(participant);
      onClose();
    }
  };

  const handleAddSelected = () => {
    if (selectedIds.size === 0) {
      return;
    }
    const selected = participants.filter(p => selectedIds.has(p.id));
    if (onSelectMultiple) {
      onSelectMultiple(selected);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Search Participants</h2>
            <p className="text-sm text-slate-500 mt-1">
              Find and add participants from your registration submissions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or organization..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 mb-4">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-slate-500 mt-4">Loading participants...</p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <UserPlus size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">No participants found</p>
              <p className="text-sm">
                {searchQuery ? 'Try a different search term' : 'No participants in your database yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredParticipants.map((participant) => {
                const isSelected = selectedIds.has(participant.id);
                const name = participant.generalInfo?.name || participant.submittedBy || 'Unknown';
                const email = participant.generalInfo?.email || participant.submittedBy || '';
                const organization = participant.generalInfo?.organization || '';
                const phone = participant.generalInfo?.phone || '';
                
                return (
                  <div
                    key={participant.id}
                    onClick={() => handleSelect(participant)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {allowMultiple && (
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600'
                                  : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <Check size={14} className="text-white" />}
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-slate-900">{name}</h4>
                            {email && (
                              <p className="text-sm text-slate-600">{email}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 ml-8">
                          {organization && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Org:</span> {organization}
                            </span>
                          )}
                          {phone && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Phone:</span> {phone}
                            </span>
                          )}
                          {participant.eventTitle && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Event:</span> {participant.eventTitle}
                            </span>
                          )}
                        </div>
                      </div>
                      {!allowMultiple && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(participant);
                          }}
                          className="ml-4 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                          <UserPlus size={16} />
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {allowMultiple && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {selectedIds.size} participant{selectedIds.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSelected}
                disabled={selectedIds.size === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <UserPlus size={16} />
                Add Selected ({selectedIds.size})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantSearchModal;

