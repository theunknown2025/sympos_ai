import {
  CommitteeInvitation,
  CommitteeInvitationInviteeSnapshot,
  InvitationStatus,
} from '../../../../../types';

export function getInviteeDisplayName(invitation: CommitteeInvitation): string {
  const snap = invitation.inviteeSnapshot;
  if (snap?.firstName || snap?.lastName) {
    return `${snap.firstName || ''} ${snap.lastName || ''}`.trim();
  }
  return invitation.juryMemberEmail;
}

export function getInvitationStatusLabel(status: InvitationStatus): string {
  switch (status) {
    case InvitationStatus.ACCEPTED:
      return 'Approved';
    case InvitationStatus.REJECTED:
      return 'Rejected';
    case InvitationStatus.PENDING:
      return 'Pending';
    default:
      return 'Not invited';
  }
}

export function formatInvitationDate(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function buildInviteeDetailRows(
  invitation: CommitteeInvitation
): { label: string; value: string }[] {
  const snap: CommitteeInvitationInviteeSnapshot = invitation.inviteeSnapshot || {};
  const rows: { label: string; value: string }[] = [];

  const push = (label: string, value?: string) => {
    if (value?.trim()) rows.push({ label, value: value.trim() });
  };

  push('Email', snap.email || invitation.juryMemberEmail);
  push('Member ID', snap.committeeMemberId);
  push('Title', snap.title);
  push('Phone', snap.phone);
  push('Address', snap.address);
  push('Nationality', snap.nationality);
  push('Gender', snap.gender);
  push('Preferred language', snap.preferredLanguage);
  push('Institution', snap.affiliation?.institution);
  push('University', snap.affiliation?.university);
  push('Organization', snap.affiliation?.organization);
  push('Department', snap.affiliation?.department);
  push('Position', snap.affiliation?.position);
  push('Country', snap.affiliation?.country);

  if (snap.researchDomains?.length) {
    push('Research domains', snap.researchDomains.join(', '));
  }

  if (invitation.invitationType === 'email') {
    push('Email subject', invitation.emailSubject);
  }

  if (invitation.commentary) {
    push('Response commentary', invitation.commentary);
  }

  return rows;
}
