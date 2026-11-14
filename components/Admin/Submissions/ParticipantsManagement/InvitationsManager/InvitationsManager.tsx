import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../../../hooks/useAuth';
import { getOrganizerParticipantInvitations } from './participantInvitationManagerService';
import { groupParticipantInvitationsIntoBatches } from './participantInvitationManagerUtils';
import ParticipantInvitationBatchList from './ParticipantInvitationBatchList';
import ParticipantInvitationBatchDetail from './ParticipantInvitationBatchDetail';

const InvitationsManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Awaited<ReturnType<typeof getOrganizerParticipantInvitations>>>([]);

  const loadInvitations = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      setError('');
      const data = await getOrganizerParticipantInvitations(currentUser.id);
      setInvitations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  const batches = useMemo(
    () => groupParticipantInvitationsIntoBatches(invitations),
    [invitations]
  );

  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId) ?? null,
    [batches, selectedBatchId]
  );

  if (selectedBatch) {
    return (
      <ParticipantInvitationBatchDetail
        batch={selectedBatch}
        onBack={() => setSelectedBatchId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Invitations Manager</h2>
          <p className="text-sm text-slate-500 mt-1">
            History of participant invitations you sent from Account Manager.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadInvitations()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <ParticipantInvitationBatchList
        batches={batches}
        loading={loading}
        onSelect={setSelectedBatchId}
      />
    </div>
  );
};

export default InvitationsManager;
