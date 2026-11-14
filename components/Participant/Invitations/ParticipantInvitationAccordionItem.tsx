import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mail,
  MessageSquare,
  Paperclip,
  XCircle,
} from 'lucide-react';
import { CommitteeInvitation, InvitationStatus } from '../../../types';
import { respondToInvitation } from '../../../services/juryMemberService';
import {
  getInvitationMessageBody,
  getInvitationTitle,
  getInvitationTypeBadge,
  getStatusLabel,
} from './participantInvitationUtils';

interface ParticipantInvitationAccordionItemProps {
  invitation: CommitteeInvitation;
  authUserId: string;
  authEmail: string;
  defaultExpanded?: boolean;
  onResponded: () => void;
}

const ParticipantInvitationAccordionItem: React.FC<ParticipantInvitationAccordionItemProps> = ({
  invitation,
  authUserId,
  authEmail,
  defaultExpanded = false,
  onResponded,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [commentary, setCommentary] = useState('');
  const [responding, setResponding] = useState(false);
  const [respondError, setRespondError] = useState('');

  const isPending = invitation.status === InvitationStatus.PENDING;
  const typeBadge = getInvitationTypeBadge(invitation);

  const borderClass =
    invitation.status === InvitationStatus.PENDING
      ? 'border-amber-200'
      : invitation.status === InvitationStatus.ACCEPTED
        ? 'border-emerald-200'
        : 'border-red-200';

  const handleRespond = async (status: InvitationStatus.ACCEPTED | InvitationStatus.REJECTED) => {
    try {
      setResponding(true);
      setRespondError('');
      await respondToInvitation(invitation.id, status, commentary, {
        userId: authUserId,
        email: authEmail,
      });
      setExpanded(false);
      onResponded();
    } catch (err: unknown) {
      setRespondError(err instanceof Error ? err.message : 'Failed to respond');
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${borderClass}`}>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left hover:bg-slate-50/80 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-slate-900">{getInvitationTitle(invitation)}</h3>
            {typeBadge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {typeBadge}
              </span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                invitation.status === InvitationStatus.PENDING
                  ? 'bg-amber-100 text-amber-800'
                  : invitation.status === InvitationStatus.ACCEPTED
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {getStatusLabel(invitation.status)}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {new Date(invitation.createdAt).toLocaleString()}
            {isPending && (
              <span className="text-indigo-600 ml-2">
                · Click to read and respond
              </span>
            )}
          </p>
        </div>
        <ChevronDown
          size={20}
          className={`text-slate-400 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 space-y-4">
          <article className="pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
              <Mail size={14} />
              Message
            </h4>
            <div className="text-slate-800 whitespace-pre-wrap text-sm leading-relaxed bg-slate-50 rounded-lg border border-slate-100 p-4">
              {getInvitationMessageBody(invitation)}
            </div>
          </article>

          {invitation.attachedFiles && invitation.attachedFiles.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                <Paperclip size={14} />
                Documents
              </h4>
              <ul className="space-y-2">
                {invitation.attachedFiles.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <span className="text-sm font-medium text-slate-900 truncate">{file.fileName}</span>
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline shrink-0"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {invitation.commentary && !isPending && (
            <section className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-500 mb-1">Your commentary</p>
              <p className="text-sm text-slate-700">{invitation.commentary}</p>
            </section>
          )}

          {isPending && (
            <section className="pt-2 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MessageSquare size={16} className="inline mr-1" />
                Commentary (optional)
              </label>
              <textarea
                value={commentary}
                onChange={(e) => setCommentary(e.target.value)}
                rows={3}
                placeholder="Add any comments with your response..."
                disabled={responding}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm mb-3"
              />
              {respondError && (
                <p className="text-sm text-red-600 mb-3">{respondError}</p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleRespond(InvitationStatus.ACCEPTED)}
                  disabled={responding}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium"
                >
                  {responding ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => void handleRespond(InvitationStatus.REJECTED)}
                  disabled={responding}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  {responding ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  Decline
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default ParticipantInvitationAccordionItem;
