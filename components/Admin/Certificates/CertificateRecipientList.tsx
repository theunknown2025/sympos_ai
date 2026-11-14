import React, { useMemo } from 'react';
import { FormSubmission } from '../../../types';
import { FileText, Loader2 } from 'lucide-react';
import {
  getParticipantDisplayName,
  getSubmissionDisplayName,
} from '../../../services/certificateGeneratorUtils';

export type RegistrationFilter = 'all' | 'internal' | 'external';

interface CertificateRecipientListProps {
  variant: 'registration' | 'submission';
  participants: FormSubmission[];
  selectedParticipants: Set<string>;
  onToggleParticipant: (id: string) => void;
  onToggleSelectAll: () => void;
  loading: boolean;
  emptyMessage: string;
  registrationFilter?: RegistrationFilter;
  onRegistrationFilterChange?: (filter: RegistrationFilter) => void;
}

const isInternalRegistration = (submission: FormSubmission): boolean =>
  !!submission.participantUserId;

const CertificateRecipientList: React.FC<CertificateRecipientListProps> = ({
  variant,
  participants,
  selectedParticipants,
  onToggleParticipant,
  onToggleSelectAll,
  loading,
  emptyMessage,
  registrationFilter = 'all',
  onRegistrationFilterChange,
}) => {
  const isRegistration = variant === 'registration';

  const filteredParticipants = useMemo(() => {
    if (!isRegistration || registrationFilter === 'all') return participants;
    if (registrationFilter === 'internal') {
      return participants.filter((p) => isInternalRegistration(p));
    }
    return participants.filter((p) => !isInternalRegistration(p));
  }, [isRegistration, participants, registrationFilter]);

  const displayName = (submission: FormSubmission) =>
    isRegistration ? getParticipantDisplayName(submission) : getSubmissionDisplayName(submission);

  const allFilteredSelected =
    filteredParticipants.length > 0 &&
    filteredParticipants.every((p) => selectedParticipants.has(p.id));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <label className="text-sm font-semibold text-slate-700">
          {isRegistration ? 'Approved participants' : 'Approved submissions'}
        </label>
        {isRegistration && onRegistrationFilterChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filter:</span>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {(['all', 'internal', 'external'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => onRegistrationFilterChange(filter)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    registrationFilter === filter
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'internal' ? 'Internal' : 'External'}
                </button>
              ))}
            </div>
          </div>
        )}
        {filteredParticipants.length > 0 && (
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {allFilteredSelected ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 py-8">
          <Loader2 className="animate-spin" size={16} />
          <span className="text-sm">Loading…</span>
        </div>
      ) : filteredParticipants.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredParticipants.map((participant) => {
            const internal = isInternalRegistration(participant);
            return (
              <label
                key={participant.id}
                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedParticipants.has(participant.id)}
                  onChange={() => onToggleParticipant(participant.id)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {displayName(participant)}
                    </p>
                    {isRegistration && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          internal
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {internal ? 'Internal' : 'External'}
                      </span>
                    )}
                  </div>
                  {(participant.generalInfo?.email ||
                    (participant.answers?.general_email as string)) && (
                    <p className="text-xs text-slate-500 truncate">
                      {participant.generalInfo?.email ||
                        (participant.answers?.general_email as string)}
                    </p>
                  )}
                  {!isRegistration && participant.submittedBy && (
                    <p className="text-xs text-slate-500 truncate">{participant.submittedBy}</p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}

      {filteredParticipants.length > 0 && (
        <p className="text-xs text-slate-500 mt-3">
          {filteredParticipants.filter((p) => selectedParticipants.has(p.id)).length} of{' '}
          {filteredParticipants.length} selected
        </p>
      )}
    </div>
  );
};

export default CertificateRecipientList;
