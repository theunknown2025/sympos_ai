import React, { useState } from 'react';
import { Search, Loader2, UserPlus, Mail, Phone, Building, AlertCircle } from 'lucide-react';
import { searchParticipants } from '../../../services/registrationSubmissionService';
import { useAuth } from '../../../hooks/useAuth';
import { FormSubmission } from '../../../types';
import AddParticipantAsPersonnelModal from './Personnel/AddParticipantAsPersonnelModal';

interface SearchParticipantProps {
  onSuccess: () => void;
}

const SearchParticipant: React.FC<SearchParticipantProps> = ({ onSuccess }) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [participants, setParticipants] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<FormSubmission | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSearch = async () => {
    if (!currentUser || !searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setParticipants([]);

    try {
      const results = await searchParticipants(currentUser.id, searchQuery.trim());
      setParticipants(results);
      if (results.length === 0) {
        setError('No participants found matching your search');
      }
    } catch (err: any) {
      console.error('Error searching participants:', err);
      setError(err.message || 'Failed to search participants');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAdd = (participant: FormSubmission) => {
    setSelectedParticipant(participant);
    setShowAddModal(true);
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    setSelectedParticipant(null);
    setSearchQuery('');
    setParticipants([]);
    onSuccess();
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Searching...
              </>
            ) : (
              <>
                <Search size={20} />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {participants.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Search Results ({participants.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-200">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-slate-900">
                        {participant.generalInfo?.name || participant.submittedBy || 'Unknown'}
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                      {participant.generalInfo?.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={16} />
                          <span>{participant.generalInfo.email}</span>
                        </div>
                      )}
                      {participant.generalInfo?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} />
                          <span>{participant.generalInfo.phone}</span>
                        </div>
                      )}
                      {participant.generalInfo?.organization && (
                        <div className="flex items-center gap-2 md:col-span-2">
                          <Building size={16} />
                          <span>{participant.generalInfo.organization}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd(participant)}
                    className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <UserPlus size={18} />
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Participant Modal */}
      {showAddModal && selectedParticipant && (
        <AddParticipantAsPersonnelModal
          participant={selectedParticipant}
          onClose={() => {
            setShowAddModal(false);
            setSelectedParticipant(null);
          }}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
};

export default SearchParticipant;

