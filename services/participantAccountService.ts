import { supabase, TABLES } from '../supabase';
import {
  CommitteeInvitationAttachment,
  CommitteeInvitationInviteeSnapshot,
  InvitationStatus,
} from '../types';
import { stripMandatoryParticipantSection } from './participantAccountEmailMandatory';
import { sendTransactionalEmail } from './emailTransport';

const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001';
const JURY_TABLE = TABLES.JURY_MEMBERS;
const INVITATIONS_TABLE = TABLES.COMMITTEE_INVITATIONS;

export interface CheckEmailsResult {
  existing: string[];
  missing: string[];
}

export interface CreateParticipantAccountResult {
  success: boolean;
  created: boolean;
  userId?: string;
  email?: string;
  message?: string;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Participant', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

async function findOrCreateJuryMemberForParticipant(
  email: string,
  fullName: string,
  authUserId?: string
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const { firstName, lastName } = splitFullName(fullName);

  const { data: existing } = await supabase
    .from(JURY_TABLE)
    .select('id, user_id')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (existing?.id) {
    if (authUserId && !existing.user_id) {
      await supabase.from(JURY_TABLE).update({ user_id: authUserId }).eq('id', existing.id);
    }
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from(JURY_TABLE)
    .insert({
      user_id: authUserId || null,
      email: normalizedEmail,
      first_name: firstName,
      last_name: lastName || 'Participant',
      profile_completed: false,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return created.id;
}

export async function checkParticipantEmails(emails: string[]): Promise<CheckEmailsResult> {
  const response = await fetch(`${EMAIL_API_URL}/api/participant-accounts/check-emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emails }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to check emails');
  }

  return {
    existing: data.existing || [],
    missing: data.missing || [],
  };
}

export async function createParticipantAccount(params: {
  fullName: string;
  email: string;
  password: string;
}): Promise<CreateParticipantAccountResult> {
  const response = await fetch(`${EMAIL_API_URL}/api/participant-accounts/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 409) {
      return { success: false, created: false, message: data.message };
    }
    throw new Error(data.message || data.error || 'Failed to create account');
  }

  return {
    success: true,
    created: data.created === true,
    userId: data.userId,
    email: data.email,
  };
}

export interface CreateParticipantInvitationParams {
  invitedBy: string;
  email: string;
  fullName: string;
  subject: string;
  content: string;
  attachedFiles?: CommitteeInvitationAttachment[];
  authUserId?: string;
  sendBatchId?: string;
}

/** Persists a participant invitation visible on the participant Invitations page. */
export async function createParticipantInvitation(
  params: CreateParticipantInvitationParams
): Promise<string> {
  const email = params.email.trim().toLowerCase();
  if (!email) {
    throw new Error('Email is required');
  }

  const { firstName, lastName } = splitFullName(params.fullName);
  const inviteeSnapshot: CommitteeInvitationInviteeSnapshot = {
    firstName,
    lastName,
    email,
  };

  const juryMemberId = await findOrCreateJuryMemberForParticipant(
    email,
    params.fullName,
    params.authUserId
  );

  const { data, error } = await supabase
    .from(INVITATIONS_TABLE)
    .insert({
      jury_member_id: juryMemberId,
      jury_member_email: email,
      invited_by: params.invitedBy,
      status: InvitationStatus.PENDING,
      invitation_type: 'participant',
      email_subject: params.subject.trim(),
      email_content: stripMandatoryParticipantSection(params.content.trim()),
      attached_files: params.attachedFiles || [],
      invitee_snapshot: inviteeSnapshot,
      send_batch_id: params.sendBatchId || null,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function sendParticipantInvitationEmail(params: {
  to: string;
  subject: string;
  html: string;
  recipientName?: string;
}): Promise<void> {
  await sendTransactionalEmail(params);
}
