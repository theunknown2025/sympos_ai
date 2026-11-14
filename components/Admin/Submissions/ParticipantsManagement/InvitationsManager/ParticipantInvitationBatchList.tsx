import React from 'react';
import { ChevronRight, Inbox, Loader2, Mail } from 'lucide-react';
import type { ParticipantInvitationBatch } from './participantInvitationManagerUtils';
import { formatSentAt } from './participantInvitationManagerUtils';

interface ParticipantInvitationBatchListProps {
  batches: ParticipantInvitationBatch[];
  loading: boolean;
  onSelect: (batchId: string) => void;
}

const ParticipantInvitationBatchList: React.FC<ParticipantInvitationBatchListProps> = ({
  batches,
  loading,
  onSelect,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4 text-sm">Loading invitation history…</p>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Inbox size={48} className="mx-auto mb-4 text-slate-300" />
        <p className="font-medium text-slate-700">No invitations sent yet</p>
        <p className="text-sm mt-1 max-w-md mx-auto">
          Invitations created from Account Manager will appear here with recipient status.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {batches.map((batch) => (
        <button
          key={batch.id}
          type="button"
          onClick={() => onSelect(batch.id)}
          className="w-full text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Mail size={16} className="text-indigo-600 shrink-0" />
                <h3 className="font-semibold text-slate-900 truncate">{batch.subject}</h3>
              </div>
              <p className="text-sm text-slate-500">
                Sent {formatSentAt(batch.sentAt)} · {batch.totalCount} recipient
                {batch.totalCount !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {batch.pendingCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {batch.pendingCount} pending
                  </span>
                )}
                {batch.acceptedCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {batch.acceptedCount} approved
                  </span>
                )}
                {batch.rejectedCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                    {batch.rejectedCount} rejected
                  </span>
                )}
              </div>
            </div>
            <ChevronRight
              size={20}
              className="text-slate-400 group-hover:text-indigo-600 shrink-0 mt-1"
            />
          </div>
        </button>
      ))}
    </div>
  );
};

export default ParticipantInvitationBatchList;
