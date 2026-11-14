import { CommitteeInvitation, InvitationStatus } from '../../../types';
import { buildFullInvitationEmailBody } from '../../../services/committeeInvitationEmailMandatory';
import { buildFullParticipantInvitationBody } from '../../../services/participantAccountEmailMandatory';

export function isParticipantInvitation(invitation: CommitteeInvitation): boolean {
  return invitation.invitationType === 'participant';
}

export function isEmailInvitation(invitation: CommitteeInvitation): boolean {
  return invitation.invitationType === 'email';
}

export function isCustomMessageInvitation(invitation: CommitteeInvitation): boolean {
  return invitation.invitationType === 'email' || invitation.invitationType === 'participant';
}

export function getInvitationTitle(invitation: CommitteeInvitation): string {
  if (isCustomMessageInvitation(invitation) && invitation.emailSubject) {
    return invitation.emailSubject;
  }
  if (isParticipantInvitation(invitation)) {
    return 'Participant invitation';
  }
  return 'Platform membership invitation';
}

export function getInvitationMessageBody(invitation: CommitteeInvitation): string {
  if (isCustomMessageInvitation(invitation) && invitation.emailContent) {
    return invitation.emailContent;
  }
  if (isParticipantInvitation(invitation)) {
    return 'You have been invited to join Sympos AI as a participant.';
  }
  return 'You have been invited to join our platform as a committee member.';
}

export function getInvitationPreview(invitation: CommitteeInvitation): string {
  const editable = getInvitationMessageBody(invitation);
  const text = isParticipantInvitation(invitation)
    ? buildFullParticipantInvitationBody(editable, invitation.juryMemberEmail).trim()
    : buildFullInvitationEmailBody(editable, invitation.juryMemberEmail).trim();
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
}

export function getInvitationTypeBadge(invitation: CommitteeInvitation): string | null {
  if (isParticipantInvitation(invitation)) return 'Participant';
  if (isEmailInvitation(invitation)) return 'Email';
  return null;
}

export function getStatusLabel(status: InvitationStatus): string {
  switch (status) {
    case InvitationStatus.ACCEPTED:
      return 'Accepted';
    case InvitationStatus.REJECTED:
      return 'Rejected';
    case InvitationStatus.PENDING:
      return 'Pending';
    default:
      return status;
  }
}
