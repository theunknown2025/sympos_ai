import { CommitteeInvitation, InvitationStatus } from '../../../../../types';

export interface ParticipantInvitationBatch {
  id: string;
  subject: string;
  sentAt: Date;
  recipients: CommitteeInvitation[];
  totalCount: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
}

export type ParticipantInvitationStatusFilter = 'all' | InvitationStatus.PENDING | InvitationStatus.ACCEPTED | InvitationStatus.REJECTED;

export function getParticipantInviteeName(invitation: CommitteeInvitation): string {
  const snap = invitation.inviteeSnapshot;
  if (snap?.firstName || snap?.lastName) {
    return `${snap.firstName || ''} ${snap.lastName || ''}`.trim();
  }
  return invitation.juryMemberEmail;
}

function legacyBatchKey(invitation: CommitteeInvitation): string {
  const subject = (invitation.emailSubject || 'Invitation').trim();
  const minute = Math.floor(invitation.createdAt.getTime() / 60000);
  return `legacy-${subject}-${minute}`;
}

export function groupParticipantInvitationsIntoBatches(
  invitations: CommitteeInvitation[]
): ParticipantInvitationBatch[] {
  const groups = new Map<string, CommitteeInvitation[]>();

  for (const inv of invitations) {
    const key = inv.sendBatchId || legacyBatchKey(inv);
    const list = groups.get(key) || [];
    list.push(inv);
    groups.set(key, list);
  }

  const batches: ParticipantInvitationBatch[] = [];

  for (const [id, recipients] of groups) {
    const sorted = [...recipients].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const sentAt = sorted.reduce(
      (earliest, inv) => (inv.createdAt < earliest ? inv.createdAt : earliest),
      sorted[0].createdAt
    );

    batches.push({
      id,
      subject: sorted[0].emailSubject || 'Participant invitation',
      sentAt,
      recipients: sorted,
      totalCount: sorted.length,
      pendingCount: sorted.filter((r) => r.status === InvitationStatus.PENDING).length,
      acceptedCount: sorted.filter((r) => r.status === InvitationStatus.ACCEPTED).length,
      rejectedCount: sorted.filter((r) => r.status === InvitationStatus.REJECTED).length,
    });
  }

  return batches.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
}

export function filterBatchRecipients(
  batch: ParticipantInvitationBatch,
  search: string,
  statusFilter: ParticipantInvitationStatusFilter
): CommitteeInvitation[] {
  const query = search.trim().toLowerCase();

  return batch.recipients.filter((inv) => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) {
      return false;
    }
    if (!query) return true;
    const name = getParticipantInviteeName(inv).toLowerCase();
    const email = inv.juryMemberEmail.toLowerCase();
    return name.includes(query) || email.includes(query);
  });
}

export function formatSentAt(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function getStatusFilterLabel(status: ParticipantInvitationStatusFilter): string {
  switch (status) {
    case InvitationStatus.PENDING:
      return 'Pending';
    case InvitationStatus.ACCEPTED:
      return 'Approved';
    case InvitationStatus.REJECTED:
      return 'Rejected';
    default:
      return 'All statuses';
  }
}
