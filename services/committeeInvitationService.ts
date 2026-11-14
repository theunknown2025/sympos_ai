import { supabase, TABLES } from '../supabase';
import {
  CommitteeInvitation,
  CommitteeInvitationAttachment,
  CommitteeInvitationInviteeSnapshot,
  CommitteeInvitationType,
  InvitationStatus,
  ReviewCommitteeMember,
} from '../types';
import { getCommitteeMember, updateCommitteeMember } from './committeeMemberService';
import { sendInvitationEmail } from './emailService';
import { stripMandatoryInvitationSection } from './committeeInvitationEmailMandatory';
import { mapInvitationFilesToEmailLinks } from './invitationEmailAttachments';

const INVITATIONS_TABLE = TABLES.COMMITTEE_INVITATIONS;
const JURY_TABLE = TABLES.JURY_MEMBERS;
const MEMBERS_TABLE = TABLES.COMMITTEE_MEMBERS;

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function mapInvitationRow(inv: Record<string, unknown>): CommitteeInvitation {
  return {
    id: inv.id as string,
    juryMemberId: inv.jury_member_id as string,
    juryMemberEmail: inv.jury_member_email as string,
    invitedBy: inv.invited_by as string,
    status: inv.status as InvitationStatus,
    commentary: (inv.commentary as string) || undefined,
    createdAt: new Date(inv.created_at as string),
    respondedAt: inv.responded_at ? new Date(inv.responded_at as string) : undefined,
    invitationType: ((inv.invitation_type as CommitteeInvitationType) || 'standard'),
    committeeMemberId: (inv.committee_member_id as string) || undefined,
    emailSubject: (inv.email_subject as string) || undefined,
    emailContent: (inv.email_content as string) || undefined,
    attachedFiles: parseJson<CommitteeInvitationAttachment[]>(inv.attached_files, []),
    inviteeSnapshot: parseJson<CommitteeInvitationInviteeSnapshot | undefined>(
      inv.invitee_snapshot,
      undefined
    ),
    sendBatchId: (inv.send_batch_id as string) || undefined,
  };
}

async function findOrCreateJuryMemberByEmail(
  email: string,
  profile?: Partial<CommitteeInvitationInviteeSnapshot>
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from(JURY_TABLE)
    .select('id')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  const insertData: Record<string, unknown> = {
    email: normalizedEmail,
    first_name: profile?.firstName?.trim() || 'Invited',
    last_name: profile?.lastName?.trim() || 'Member',
    title: profile?.title || null,
    gender: profile?.gender || null,
    nationality: profile?.nationality || null,
    phone: profile?.phone || null,
    address: profile?.address || null,
    preferred_language: profile?.preferredLanguage || null,
    affiliation: JSON.stringify(profile?.affiliation || {}),
    research_domains: JSON.stringify(profile?.researchDomains || []),
    links: JSON.stringify(profile?.identifiers || {}),
    profile_completed: false,
  };

  const { data: created, error } = await supabase
    .from(JURY_TABLE)
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return created.id;
}

export function inviteeSnapshotFromMember(
  member: Omit<ReviewCommitteeMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): CommitteeInvitationInviteeSnapshot {
  return {
    committeeMemberId: member.committeeMemberId,
    firstName: member.firstName,
    lastName: member.lastName,
    title: member.title,
    gender: member.gender,
    nationality: member.nationality,
    email: member.email,
    phone: member.phone,
    address: member.address,
    preferredLanguage: member.preferredLanguage,
    affiliation: member.affiliation,
    researchDomains: member.researchDomains,
    identifiers: member.identifiers,
    country: member.affiliation?.country,
    position: member.affiliation?.position,
  };
}

export function memberFromInvitation(invitation: CommitteeInvitation): ReviewCommitteeMember | null {
  const snap = invitation.inviteeSnapshot;
  if (!snap?.email && !invitation.juryMemberEmail) {
    return null;
  }

  return {
    id: invitation.committeeMemberId || invitation.id,
    userId: invitation.invitedBy,
    committeeMemberId: snap?.committeeMemberId || `CM-INV-${invitation.id.slice(0, 8)}`,
    firstName: snap?.firstName || 'Invited',
    lastName: snap?.lastName || 'Member',
    title: snap?.title,
    gender: snap?.gender,
    nationality: snap?.nationality,
    email: snap?.email || invitation.juryMemberEmail,
    phone: snap?.phone,
    address: snap?.address,
    preferredLanguage: snap?.preferredLanguage,
    affiliation: snap?.affiliation || {
      country: snap?.country,
      position: snap?.position,
    },
    researchDomains: snap?.researchDomains,
    identifiers: snap?.identifiers || {},
    createdAt: invitation.createdAt,
    updatedAt: invitation.createdAt,
  };
}

/**
 * All invitations sent by an organizer
 */
export const getOrganizerInvitations = async (organizerUserId: string): Promise<CommitteeInvitation[]> => {
  const { data, error } = await supabase
    .from(INVITATIONS_TABLE)
    .select('*')
    .eq('invited_by', organizerUserId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => mapInvitationRow(row));
};

export const getOrganizerInvitation = async (
  invitationId: string,
  organizerUserId: string
): Promise<CommitteeInvitation | null> => {
  const { data, error } = await supabase
    .from(INVITATIONS_TABLE)
    .select('*')
    .eq('id', invitationId)
    .eq('invited_by', organizerUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapInvitationRow(data) : null;
};

export interface CreateStandardInvitationParams {
  committeeMemberId: string;
  memberEmail: string;
  invitedBy: string;
}

export const createStandardInvitation = async (
  params: CreateStandardInvitationParams
): Promise<string> => {
  const member = await getCommitteeMember(params.committeeMemberId);
  if (!member) {
    throw new Error('Committee member not found');
  }

  const juryMemberId = await findOrCreateJuryMemberByEmail(params.memberEmail, inviteeSnapshotFromMember(member));

  const { data, error } = await supabase
    .from(INVITATIONS_TABLE)
    .insert({
      jury_member_id: juryMemberId,
      jury_member_email: params.memberEmail.trim().toLowerCase(),
      invited_by: params.invitedBy,
      status: InvitationStatus.PENDING,
      invitation_type: 'standard',
      committee_member_id: params.committeeMemberId,
      invitee_snapshot: inviteeSnapshotFromMember(member),
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
};

export interface CreateEmailInvitationParams {
  invitedBy: string;
  email: string;
  subject: string;
  content: string;
  attachedFiles?: CommitteeInvitationAttachment[];
  inviteeSnapshot?: CommitteeInvitationInviteeSnapshot;
  committeeMemberId?: string;
  sendEmail?: boolean;
}

export const createEmailInvitation = async (params: CreateEmailInvitationParams): Promise<string> => {
  const email = params.email.trim().toLowerCase();
  if (!email) {
    throw new Error('Email is required');
  }

  const juryMemberId = await findOrCreateJuryMemberByEmail(email, params.inviteeSnapshot);

  const { data, error } = await supabase
    .from(INVITATIONS_TABLE)
    .insert({
      jury_member_id: juryMemberId,
      jury_member_email: email,
      invited_by: params.invitedBy,
      status: InvitationStatus.PENDING,
      invitation_type: 'email',
      committee_member_id: params.committeeMemberId || null,
      email_subject: params.subject.trim(),
      email_content: stripMandatoryInvitationSection(params.content.trim()),
      attached_files: params.attachedFiles || [],
      invitee_snapshot: params.inviteeSnapshot || { email },
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  if (params.sendEmail !== false) {
    const fullName =
      params.inviteeSnapshot?.firstName && params.inviteeSnapshot?.lastName
        ? `${params.inviteeSnapshot.firstName} ${params.inviteeSnapshot.lastName}`
        : email;

    const emailAttachmentLinks = mapInvitationFilesToEmailLinks(params.attachedFiles);

    await sendInvitationEmail(
      [{ email, fullName }],
      params.subject.trim(),
      params.content.trim(),
      emailAttachmentLinks.length > 0 ? emailAttachmentLinks : undefined,
      { includeCommitteeInvitationMandatoryFooter: true }
    );
  }

  return data.id;
};

export interface UpdateInvitationParams {
  invitationId: string;
  organizerUserId: string;
  subject?: string;
  content?: string;
  attachedFiles?: CommitteeInvitationAttachment[];
  inviteeSnapshot?: CommitteeInvitationInviteeSnapshot;
  committeeMemberId?: string;
}

export const updateInvitation = async (params: UpdateInvitationParams): Promise<void> => {
  const existing = await getOrganizerInvitation(params.invitationId, params.organizerUserId);
  if (!existing) {
    throw new Error('Invitation not found');
  }

  if (existing.status !== InvitationStatus.PENDING) {
    throw new Error('Only pending invitations can be edited');
  }

  const updateData: Record<string, unknown> = {};

  if (params.subject !== undefined) updateData.email_subject = params.subject;
  if (params.content !== undefined) {
    updateData.email_content = stripMandatoryInvitationSection(params.content);
  }
  if (params.attachedFiles !== undefined) updateData.attached_files = params.attachedFiles;
  if (params.inviteeSnapshot !== undefined) {
    updateData.invitee_snapshot = params.inviteeSnapshot;
    if (params.inviteeSnapshot.email) {
      updateData.jury_member_email = params.inviteeSnapshot.email.trim().toLowerCase();
    }
  }
  if (params.committeeMemberId !== undefined) {
    updateData.committee_member_id = params.committeeMemberId;
  }

  const { error } = await supabase
    .from(INVITATIONS_TABLE)
    .update(updateData)
    .eq('id', params.invitationId)
    .eq('invited_by', params.organizerUserId);

  if (error) {
    throw error;
  }

  if (existing.committeeMemberId && params.inviteeSnapshot) {
    const memberPayload = snapshotToMemberPayload(params.inviteeSnapshot);
    if (memberPayload) {
      await updateCommitteeMember(existing.committeeMemberId, memberPayload);
    }
  }
};

function snapshotToMemberPayload(
  snap: CommitteeInvitationInviteeSnapshot
): Partial<Omit<ReviewCommitteeMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> | null {
  if (!snap.email) return null;
  return {
    committeeMemberId: snap.committeeMemberId,
    firstName: snap.firstName,
    lastName: snap.lastName,
    title: snap.title,
    gender: snap.gender,
    nationality: snap.nationality,
    email: snap.email,
    phone: snap.phone,
    address: snap.address,
    preferredLanguage: snap.preferredLanguage,
    affiliation: snap.affiliation,
    researchDomains: snap.researchDomains,
    identifiers: snap.identifiers,
  };
}

export const updateInvitationFromMemberForm = async (
  invitationId: string,
  organizerUserId: string,
  memberData: Omit<ReviewCommitteeMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> => {
  const snapshot = inviteeSnapshotFromMember(memberData);
  await updateInvitation({
    invitationId,
    organizerUserId,
    inviteeSnapshot: snapshot,
  });

  const existing = await getOrganizerInvitation(invitationId, organizerUserId);
  if (existing?.committeeMemberId) {
    await updateCommitteeMember(existing.committeeMemberId, memberData);
  }
};

export const deleteInvitation = async (invitationId: string, organizerUserId: string): Promise<void> => {
  const { error } = await supabase
    .from(INVITATIONS_TABLE)
    .delete()
    .eq('id', invitationId)
    .eq('invited_by', organizerUserId);

  if (error) {
    throw error;
  }
};

export const mapDbInvitation = mapInvitationRow;

/**
 * After an invitation is accepted, create/link a committee_members row for the organizer
 * so the invitee appears in Membres → Liste and New Committee member pools.
 */
export const syncCommitteeMemberForAcceptedInvitation = async (
  invitationId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('sync_committee_member_for_invitation_id', {
      p_invitation_id: invitationId,
    });

    if (error) {
      console.warn('sync_committee_member_for_invitation_id RPC failed:', error.message);
      return null;
    }

    return (data as string) || null;
  } catch (err) {
    console.warn('syncCommitteeMemberForAcceptedInvitation error:', err);
    return null;
  }
};
