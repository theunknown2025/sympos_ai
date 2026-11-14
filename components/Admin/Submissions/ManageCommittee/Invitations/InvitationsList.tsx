import React, { useCallback, useEffect, useState } from 'react';
import {
  Mail,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Loader2,
  Inbox,
  Paperclip,
} from 'lucide-react';
import { useAuth } from '../../../../../hooks/useAuth';
import {
  deleteInvitation,
  getOrganizerInvitations,
  memberFromInvitation,
} from '../../../../../services/committeeInvitationService';
import type { CommitteeInvitation, ReviewCommitteeMember } from '../../../../../types';
import { InvitationStatus } from '../../../../../types';
import MemberForm from '../MemberForm';
import InvitationStatusBadge from './InvitationStatusBadge';
import {
  buildInviteeDetailRows,
  formatInvitationDate,
  getInviteeDisplayName,
} from './invitationUtils';
import { stripMandatoryInvitationSection } from '../../../../../services/committeeInvitationEmailMandatory';
import MandatoryInvitationResponseNotice from './MandatoryInvitationResponseNotice';

interface InvitationsListProps {
  refreshTrigger?: number;
}

const InvitationsList: React.FC<InvitationsListProps> = ({ refreshTrigger = 0 }) => {
  const { currentUser } = useAuth();
  const [invitations, setInvitations] = useState<CommitteeInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingInvitation, setEditingInvitation] = useState<CommitteeInvitation | null>(null);
  const [editingMember, setEditingMember] = useState<ReviewCommitteeMember | null>(null);

  const loadInvitations = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const data = await getOrganizerInvitations(currentUser.id);
      setInvitations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations, refreshTrigger]);

  const handleDelete = async (invitation: CommitteeInvitation) => {
    if (!currentUser?.id) return;
    if (
      !window.confirm(
        `Delete the invitation sent to ${getInviteeDisplayName(invitation)}? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      setDeletingId(invitation.id);
      await deleteInvitation(invitation.id, currentUser.id);
      await loadInvitations();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete invitation');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (invitation: CommitteeInvitation) => {
    const pseudo = memberFromInvitation(invitation);
    if (!pseudo) return;
    setEditingInvitation(invitation);
    setEditingMember(pseudo);
  };

  if (editingInvitation && editingMember) {
    return (
      <div>
        <MemberForm
          member={editingMember}
          inline
          invitationId={editingInvitation.id}
          onClose={() => {
            setEditingInvitation(null);
            setEditingMember(null);
          }}
          onSuccess={() => {
            setEditingInvitation(null);
            setEditingMember(null);
            loadInvitations();
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 mt-4">Loading invitations...</p>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Inbox size={48} className="mx-auto mb-4 opacity-20" />
        <p className="font-medium text-slate-600">No invitations yet</p>
        <p className="text-sm mt-1">Send a standard or email invitation from the New Membre tab</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((invitation) => {
        const isExpanded = expandedId === invitation.id;
        const detailRows = buildInviteeDetailRows(invitation);
        const canEdit = invitation.status === InvitationStatus.PENDING;

        return (
          <div
            key={invitation.id}
            className="border border-slate-200 rounded-lg bg-white overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : invitation.id)}
              className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900 truncate">
                    {getInviteeDisplayName(invitation)}
                  </span>
                  <InvitationStatusBadge status={invitation.status} />
                  {invitation.invitationType === 'email' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      <Mail size={12} />
                      Sent by email
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      Standard
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 truncate">{invitation.juryMemberEmail}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sent {formatInvitationDate(invitation.createdAt)}
                  {invitation.respondedAt &&
                    ` · Responded ${formatInvitationDate(invitation.respondedAt)}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(invitation);
                      }}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="Edit invitation"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(invitation);
                      }}
                      disabled={deletingId === invitation.id}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      title="Delete invitation"
                    >
                      {deletingId === invitation.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </>
                )}
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                {invitation.invitationType === 'email' && invitation.emailContent && (
                  <div className="mb-4 mt-3 space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Custom message</h4>
                      <div className="p-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                        {stripMandatoryInvitationSection(invitation.emailContent)}
                      </div>
                    </div>
                    <MandatoryInvitationResponseNotice recipientEmail={invitation.juryMemberEmail} />
                  </div>
                )}
                {invitation.invitationType === 'standard' && (
                  <div className="mb-4 mt-3">
                    <MandatoryInvitationResponseNotice recipientEmail={invitation.juryMemberEmail} />
                  </div>
                )}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {detailRows.map((row) => (
                    <div key={row.label}>
                      <dt className="text-xs font-medium text-slate-500">{row.label}</dt>
                      <dd className="text-sm text-slate-900 mt-0.5 break-words">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                {invitation.attachedFiles && invitation.attachedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                      <Paperclip size={14} />
                      Attachments
                    </h4>
                    <ul className="space-y-2">
                      {invitation.attachedFiles.map((file) => (
                        <li key={file.id}>
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:underline"
                          >
                            {file.fileName}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default InvitationsList;
