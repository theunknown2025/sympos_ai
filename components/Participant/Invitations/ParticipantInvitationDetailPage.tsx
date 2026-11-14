import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import {
  getParticipantInvitationById,
  respondToInvitation,
} from '../../../services/juryMemberService';
import { CommitteeInvitation, InvitationStatus } from '../../../types';
import { getInvitationTitle, getInvitationMessageBody, getInvitationTypeBadge } from './participantInvitationUtils';

const ParticipantInvitationDetailPage: React.FC = () => {
  const { invitationId } = useParams<{ invitationId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [invitation, setInvitation] = useState<CommitteeInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentary, setCommentary] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.id || !currentUser.email || !invitationId) return;
      try {
        setLoading(true);
        setError('');
        const found = await getParticipantInvitationById(
          invitationId,
          currentUser.id,
          currentUser.email
        );
        if (!found) {
          setError('Invitation not found for your account email');
          return;
        }
        setInvitation(found);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.id, invitationId]);

  const handleRespond = async (status: InvitationStatus.ACCEPTED | InvitationStatus.REJECTED) => {
    if (!invitation) return;
    try {
      setResponding(true);
      if (!currentUser?.id || !currentUser.email) return;
      await respondToInvitation(invitation.id, status, commentary, {
        userId: currentUser.id,
        email: currentUser.email,
      });
      navigate('/jury/invitations');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to respond');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 max-w-2xl">
        <AlertCircle size={20} className="inline mr-2" />
        {error || 'Invitation not found'}
        <div className="mt-4">
          <Link to="/jury/invitations" className="text-indigo-600 hover:underline text-sm">
            Back to invitations
          </Link>
        </div>
      </div>
    );
  }

  const isPending = invitation.status === InvitationStatus.PENDING;
  const typeBadge = getInvitationTypeBadge(invitation);
  const editableMessage = getInvitationMessageBody(invitation);

  return (
    <div className="h-full max-w-3xl">
      <Link
        to="/jury/invitations"
        className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft size={16} />
        Back to invitations
      </Link>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {typeBadge && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              <Mail size={12} />
              {typeBadge} invitation
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              invitation.status === InvitationStatus.PENDING
                ? 'bg-amber-100 text-amber-800'
                : invitation.status === InvitationStatus.ACCEPTED
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {invitation.status}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{getInvitationTitle(invitation)}</h1>
        <p className="text-sm text-slate-500 mt-1">
          Received {new Date(invitation.createdAt).toLocaleString()}
        </p>
      </header>

      <article className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Message
        </h2>
        <div className="prose prose-slate max-w-none text-slate-800 whitespace-pre-wrap text-sm leading-relaxed">
          {editableMessage}
        </div>
      </article>

      {invitation.attachedFiles && invitation.attachedFiles.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Paperclip size={16} />
            Documents
          </h2>
          <ul className="space-y-3">
            {invitation.attachedFiles.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100"
              >
                <span className="text-sm font-medium text-slate-900 truncate">{file.fileName}</span>
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:underline flex-shrink-0"
                >
                  Download — {file.fileName}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {invitation.commentary && !isPending && (
        <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-slate-500 mb-1">Your commentary</p>
          <p className="text-sm text-slate-700">{invitation.commentary}</p>
        </section>
      )}

      {isPending && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <MessageSquare size={16} className="inline mr-1" />
            Commentary (optional)
          </label>
          <textarea
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            rows={4}
            placeholder="Add any comments..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-4"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleRespond(InvitationStatus.ACCEPTED)}
              disabled={responding}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {responding ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Accept
            </button>
            <button
              type="button"
              onClick={() => handleRespond(InvitationStatus.REJECTED)}
              disabled={responding}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {responding ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
              Decline
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default ParticipantInvitationDetailPage;
