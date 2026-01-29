import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, XCircle, Clock, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getJuryMemberProfile, getJuryMemberInvitations, respondToInvitation } from '../../services/juryMemberService';
import { CommitteeInvitation, InvitationStatus } from '../../types';

const Invitations: React.FC = () => {
  const { currentUser } = useAuth();
  const [invitations, setInvitations] = useState<CommitteeInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<CommitteeInvitation | null>(null);
  const [responseStatus, setResponseStatus] = useState<InvitationStatus.ACCEPTED | InvitationStatus.REJECTED | null>(null);
  const [commentary, setCommentary] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadInvitations();
    }
  }, [currentUser]);

  const loadInvitations = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      setError('');

      const profile = await getJuryMemberProfile(currentUser.id);
      if (profile) {
        const invitationsData = await getJuryMemberInvitations(profile.id);
        setInvitations(invitationsData);
      }
    } catch (err: any) {
      console.error('Error loading invitations:', err);
      setError(err.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (invitation: CommitteeInvitation, status: InvitationStatus.ACCEPTED | InvitationStatus.REJECTED) => {
    setSelectedInvitation(invitation);
    setResponseStatus(status);
    setCommentary('');
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedInvitation || !responseStatus) return;

    try {
      setRespondingId(selectedInvitation.id);
      await respondToInvitation(selectedInvitation.id, responseStatus!, commentary);

      // Update local state
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvitation.id
            ? {
                ...inv,
                status: responseStatus!,
                commentary: commentary || undefined,
                respondedAt: new Date(),
              }
            : inv
        )
      );

      setShowResponseModal(false);
      setSelectedInvitation(null);
      setResponseStatus(null);
      setCommentary('');
    } catch (err: any) {
      console.error('Error responding to invitation:', err);
      alert(err.message || 'Failed to respond to invitation. Please try again.');
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4">Loading invitations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error loading invitations</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadInvitations}
              className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === InvitationStatus.PENDING);
  const acceptedInvitations = invitations.filter((inv) => inv.status === InvitationStatus.ACCEPTED);
  const rejectedInvitations = invitations.filter((inv) => inv.status === InvitationStatus.REJECTED);

  return (
    <div className="h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Mail size={32} className="text-indigo-600" />
          Committee Invitations
        </h1>
        <p className="text-slate-500 mt-1 text-sm">View and respond to committee invitations</p>
      </header>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-amber-700">Pending</h3>
            <Clock className="text-amber-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-amber-900">{pendingInvitations.length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-emerald-700">Accepted</h3>
            <CheckCircle2 className="text-emerald-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-emerald-900">{acceptedInvitations.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-red-700">Rejected</h3>
            <XCircle className="text-red-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-red-900">{rejectedInvitations.length}</p>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pending Invitations</h2>
          <div className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white border border-amber-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Platform Membership Invitation</h3>
                    <p className="text-sm text-slate-600 mb-2">
                      You have been invited to join our platform as a member.
                    </p>
                    <p className="text-xs text-slate-400">
                      Received: {new Date(invitation.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleRespond(invitation, InvitationStatus.ACCEPTED)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(invitation, InvitationStatus.REJECTED)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Invitations */}
      {acceptedInvitations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Accepted Invitations</h2>
          <div className="space-y-4">
            {acceptedInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white border border-emerald-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">Platform Membership Invitation</h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        Accepted
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      You have accepted the invitation to join our platform as a member.
                    </p>
                    {invitation.commentary && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-medium text-slate-500 mb-1">Your Commentary:</p>
                        <p className="text-sm text-slate-700">{invitation.commentary}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      Responded: {invitation.respondedAt ? new Date(invitation.respondedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Invitations */}
      {rejectedInvitations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Rejected Invitations</h2>
          <div className="space-y-4">
            {rejectedInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white border border-red-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">Platform Membership Invitation</h3>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        Rejected
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      You have rejected the invitation to join our platform as a member.
                    </p>
                    {invitation.commentary && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-medium text-slate-500 mb-1">Your Commentary:</p>
                        <p className="text-sm text-slate-700">{invitation.commentary}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      Responded: {invitation.respondedAt ? new Date(invitation.respondedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invitations.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Mail size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">No invitations</p>
          <p className="text-sm">You haven't received any committee invitations yet</p>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedInvitation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {responseStatus === InvitationStatus.ACCEPTED ? 'Accept Invitation' : 'Reject Invitation'}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              You are responding to a platform membership invitation.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MessageSquare size={16} className="inline mr-1" />
                Commentary (Optional)
              </label>
              <textarea
                value={commentary}
                onChange={(e) => setCommentary(e.target.value)}
                rows={4}
                placeholder="Add any comments or notes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedInvitation(null);
                  setResponseStatus(null);
                  setCommentary('');
                }}
                className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={respondingId === selectedInvitation.id}
                className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
                  responseStatus === InvitationStatus.ACCEPTED
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {respondingId === selectedInvitation.id ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Processing...
                  </>
                ) : (
                  <>
                    {responseStatus === InvitationStatus.ACCEPTED ? (
                      <>
                        <CheckCircle2 size={18} />
                        Accept
                      </>
                    ) : (
                      <>
                        <XCircle size={18} />
                        Reject
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invitations;

