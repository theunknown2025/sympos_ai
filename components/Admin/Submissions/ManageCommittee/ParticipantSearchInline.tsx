import React, { useState } from 'react';
import { X, Search, Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { searchParticipants } from '../../../../services/registrationSubmissionService';
import { FormSubmission } from '../../../../types';

interface ParticipantSearchInlineProps {
  onSelect: (participant: FormSubmission) => void;
  onClose: () => void;
}

const ParticipantSearchInline: React.FC<ParticipantSearchInlineProps> = ({
  onSelect,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [participants, setParticipants] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!currentUser?.id) return;
    
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setHasSearched(true);
      const results = await searchParticipants(currentUser.id, searchQuery);
      setParticipants(results);
    } catch (err: any) {
      console.error('Error searching participants:', err);
      setError(err.message || 'Failed to search participants');
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelect = (participant: FormSubmission) => {
    onSelect(participant);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Search Participants</h3>
          <p className="text-sm text-slate-500 mt-1">
            Find and add participants from your registration submissions
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by name, email, or organization..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Searching...
              </>
            ) : (
              <>
                <Search size={18} />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[500px] overflow-y-auto">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 mb-4">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-slate-500 mt-4">Searching participants...</p>
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-12 text-slate-400">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">Enter a search term and click Search</p>
            <p className="text-sm">Search by name, email, or organization</p>
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <UserPlus size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">No participants found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-2">
            {participants.map((participant) => {
              const name = participant.generalInfo?.name || participant.submittedBy || 'Unknown';
              const email = participant.generalInfo?.email || participant.submittedBy || '';
              const organization = participant.generalInfo?.organization || '';
              const phone = participant.generalInfo?.phone || '';
              
              return (
                <div
                  key={participant.id}
                  onClick={() => handleSelect(participant)}
                  className="p-4 border border-slate-200 rounded-lg cursor-pointer transition-all hover:border-indigo-300 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2">
                        <h4 className="font-semibold text-slate-900">{name}</h4>
                        {email && (
                          <p className="text-sm text-slate-600">{email}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantSearchInline;

