import { supabase, TABLES } from '../supabase';
import { JuryMember, CommitteeInvitation, InvitationStatus, EventAttendance, Event } from '../types';
import { mapDbInvitation, syncCommitteeMemberForAcceptedInvitation } from './committeeInvitationService';
import {
  mapParticipantEventRow,
  isPublishedParticipantEvent,
  PARTICIPANT_EVENT_LIST_COLUMNS,
} from './participantEventRowMapper';
import { mapEventTemplateFields } from './eventTemplateFields';

const TABLE_NAME = TABLES.JURY_MEMBERS;
const INVITATIONS_TABLE = TABLES.COMMITTEE_INVITATIONS;
const ATTENDANCE_TABLE = TABLES.EVENT_ATTENDANCE;

const normalizeAuthEmail = (email: string): string => email.trim().toLowerCase();

const mapJuryMemberRow = (data: Record<string, unknown>): JuryMember => {
  const affiliation = data.affiliation
    ? JSON.parse(data.affiliation as string)
    : {};
  const researchDomains = data.research_domains
    ? JSON.parse(data.research_domains as string)
    : [];
  const identifiers = data.links ? JSON.parse(data.links as string) : {};

  return {
    id: data.id as string,
    userId: data.user_id as string,
    firstName: data.first_name as string,
    lastName: data.last_name as string,
    title: data.title as string | undefined,
    gender: data.gender as string | undefined,
    nationality: data.nationality as string | undefined,
    email: data.email as string,
    phone: data.phone as string | undefined,
    address: data.address as string | undefined,
    preferredLanguage: data.preferred_language as string | undefined,
    affiliation,
    researchDomains,
    identifiers,
    profileCompleted: Boolean(data.profile_completed),
    createdAt: new Date(data.created_at as string),
    updatedAt: new Date(data.updated_at as string),
  };
};

/**
 * When a participant logs in, link pre-created jury rows (from email invitations) to their account.
 */
export const linkJuryMemberToAuthUser = async (
  authUserId: string,
  authEmail: string
): Promise<void> => {
  const normalizedEmail = normalizeAuthEmail(authEmail);
  if (!normalizedEmail) return;

  const { data: byEmail, error } = await supabase
    .from(TABLE_NAME)
    .select('id, user_id')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (error || !byEmail?.id || byEmail.user_id) return;

  await supabase.from(TABLE_NAME).update({ user_id: authUserId }).eq('id', byEmail.id);
};

/**
 * Resolve jury member ids for the logged-in participant (by user id and/or email).
 */
export const resolveParticipantJuryMemberIds = async (
  authUserId: string,
  authEmail: string
): Promise<string[]> => {
  const normalizedEmail = normalizeAuthEmail(authEmail);
  await linkJuryMemberToAuthUser(authUserId, normalizedEmail);

  const ids = new Set<string>();

  const { data: byUser } = await supabase
    .from(TABLE_NAME)
    .select('id')
    .eq('user_id', authUserId);
  (byUser || []).forEach((row) => ids.add(row.id));

  if (normalizedEmail) {
    const { data: byEmail } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .ilike('email', normalizedEmail);
    (byEmail || []).forEach((row) => ids.add(row.id));
  }

  return [...ids];
};

/**
 * Invitations for the logged-in participant (matched by account email).
 */
export const getParticipantInvitationsForUser = async (
  authUserId: string,
  authEmail: string
): Promise<CommitteeInvitation[]> => {
  const normalizedEmail = normalizeAuthEmail(authEmail);
  const juryMemberIds = await resolveParticipantJuryMemberIds(authUserId, normalizedEmail);

  if (juryMemberIds.length > 0) {
    const { data, error } = await supabase
      .from(INVITATIONS_TABLE)
      .select('*')
      .in('jury_member_id', juryMemberIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((inv) => mapDbInvitation(inv));
  }

  if (!normalizedEmail) return [];

  const { data, error } = await supabase
    .from(INVITATIONS_TABLE)
    .select('*')
    .ilike('jury_member_email', normalizedEmail)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((inv) => mapDbInvitation(inv));
};

export const getParticipantInvitationById = async (
  invitationId: string,
  authUserId: string,
  authEmail: string
): Promise<CommitteeInvitation | null> => {
  const invitations = await getParticipantInvitationsForUser(authUserId, authEmail);
  return invitations.find((inv) => inv.id === invitationId) ?? null;
};

/**
 * Save or update a jury member profile
 */
export const saveJuryMemberProfile = async (
  userId: string,
  profile: Omit<JuryMember, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'profileCompleted'>
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check if profile already exists
    const { data: existing } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('user_id', userId)
      .single();

    // Serialize JSON fields for Supabase storage
    const profileData: any = {
      user_id: userId,
      email: profile.email,
      first_name: profile.firstName,
      last_name: profile.lastName,
      title: profile.title || null,
      gender: profile.gender || null,
      nationality: profile.nationality || null,
      phone: profile.phone || null,
      address: profile.address || null,
      preferred_language: profile.preferredLanguage || null,
      affiliation: JSON.stringify(profile.affiliation || {}),
      research_domains: JSON.stringify(profile.researchDomains || []),
      links: JSON.stringify(profile.identifiers || {}),
      profile_completed: true,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Update existing profile
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(profileData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return existing.id;
    } else {
      // Create new profile
      profileData.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(profileData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data.id;
    }
  } catch (error: any) {
    console.error('Error saving jury member profile:', error);
    throw new Error(error.message || 'Failed to save profile');
  }
};

/**
 * Get jury member profile by user ID
 */
export const getJuryMemberProfile = async (userId: string): Promise<JuryMember | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Profile doesn't exist
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapJuryMemberRow(data as Record<string, unknown>);
  } catch (error: any) {
    console.error('Error getting jury member profile:', error);
    throw error;
  }
};

/**
 * Get all invitations for a jury member
 */
export const getJuryMemberInvitations = async (juryMemberId: string): Promise<CommitteeInvitation[]> => {
  try {
    const { data, error } = await supabase
      .from(INVITATIONS_TABLE)
      .select('*')
      .eq('jury_member_id', juryMemberId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((inv) => mapDbInvitation(inv));
  } catch (error: any) {
    console.error('Error getting invitations:', error);
    throw error;
  }
};

/**
 * Respond to an invitation (accept or reject)
 */
export const respondToInvitation = async (
  invitationId: string,
  status: InvitationStatus.ACCEPTED | InvitationStatus.REJECTED,
  commentary?: string,
  authContext?: { userId: string; email: string }
): Promise<void> => {
  try {
    let invitationType: CommitteeInvitation['invitationType'] | undefined;

    if (authContext) {
      const owned = await getParticipantInvitationById(
        invitationId,
        authContext.userId,
        authContext.email
      );
      if (!owned) {
        throw new Error('Invitation not found or you do not have access to respond');
      }
      if (owned.status !== InvitationStatus.PENDING) {
        throw new Error('This invitation has already been answered');
      }
      invitationType = owned.invitationType;
    }

    const { error } = await supabase
      .from(INVITATIONS_TABLE)
      .update({
        status,
        commentary: commentary || null,
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (error) {
      throw error;
    }

    if (status === InvitationStatus.ACCEPTED && invitationType !== 'participant') {
      await syncCommitteeMemberForAcceptedInvitation(invitationId);
    }
  } catch (error: any) {
    console.error('Error responding to invitation:', error);
    throw new Error(error.message || 'Failed to respond to invitation');
  }
};

/**
 * Get all events for a jury member
 */
export const getJuryMemberEvents = async (juryMemberId: string): Promise<EventAttendance[]> => {
  try {
    const { data, error } = await supabase
      .from(ATTENDANCE_TABLE)
      .select('*')
      .eq('jury_member_id', juryMemberId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((att) => ({
      id: att.id,
      eventId: att.event_id,
      eventName: att.event_name,
      juryMemberId: att.jury_member_id,
      juryMemberEmail: att.jury_member_email,
      attendanceConfirmed: att.attendance_confirmed || false,
      confirmedAt: att.confirmed_at ? new Date(att.confirmed_at) : undefined,
      createdAt: new Date(att.created_at),
    }));
  } catch (error: any) {
    console.error('Error getting events:', error);
    throw error;
  }
};

/**
 * Confirm attendance for an event
 */
export const confirmEventAttendance = async (
  eventId: string,
  juryMemberId: string,
  juryMemberEmail: string,
  eventName: string
): Promise<void> => {
  try {
    // Check if attendance record already exists
    const { data: existing } = await supabase
      .from(ATTENDANCE_TABLE)
      .select('id')
      .eq('event_id', eventId)
      .eq('jury_member_id', juryMemberId)
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from(ATTENDANCE_TABLE)
        .update({
          attendance_confirmed: true,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        throw error;
      }
    } else {
      // Create new attendance record
      const { error } = await supabase
        .from(ATTENDANCE_TABLE)
        .insert({
          event_id: eventId,
          event_name: eventName,
          jury_member_id: juryMemberId,
          jury_member_email: juryMemberEmail,
          attendance_confirmed: true,
          confirmed_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }
    }
  } catch (error: any) {
    console.error('Error confirming attendance:', error);
    throw new Error(error.message || 'Failed to confirm attendance');
  }
};

/**
 * Get all available events (for jury members to browse)
 * Only returns events with publish_status = 'Published' or 'Closed'
 * Draft events are excluded
 */
export const getAvailableEvents = async (participantUserId: string): Promise<any[]> => {
  try {
    // Determine whether the user already has explicit campus memberships.
    // Backward compatibility: if they have no membership rows yet, fall back to returning
    // all Published/Closed events (as in the pre-campus model).
    const { data: memberships, error: membershipErr } = await supabase
      .from(TABLES.PARTICIPANT_MEMBERSHIPS)
      .select('campus_id, subscription_status')
      .eq('participant_user_id', participantUserId);

    if (membershipErr) throw membershipErr;

    const hasAnyMembership = (memberships || []).length > 0;
    const activeCampusIds = (memberships || [])
      .filter(m => m.subscription_status === 'active' && !!m.campus_id)
      .map(m => m.campus_id);

    if (hasAnyMembership && activeCampusIds.length === 0) {
      return [];
    }

    let eventsQuery = supabase
      .from(TABLES.EVENTS)
      .select('*')
      .in('publish_status', ['Published', 'Closed']);

    if (hasAnyMembership && activeCampusIds.length > 0) {
      eventsQuery = eventsQuery.in('campus_id', activeCampusIds);
    }

    const { data, error } = await eventsQuery.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    // Helper function to deserialize JSON arrays
    const deserializeArray = (value: any): any[] => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };
    
    // Helper function to get array from new column or fallback to old column
    const getArrayOrFallback = (newColumnValue: any, oldColumnValue: any): string[] => {
      const newArray = deserializeArray(newColumnValue);
      if (newArray.length > 0) {
        return newArray;
      }
      // Fallback to old column if new column is empty
      if (oldColumnValue) {
        return [oldColumnValue];
      }
      return [];
    };

    return data.map((event) => ({
      id: event.id,
      userId: event.user_id,
      campusId: event.campus_id || undefined,
      name: event.name,
      description: event.description || undefined,
      keywords: deserializeArray(event.keywords) as string[],
      partners: deserializeArray(event.partners) as any[],
      dates: deserializeArray(event.dates) as any[],
      location: event.location || undefined,
      links: deserializeArray(event.links) as any[],
      landingPageIds: getArrayOrFallback(event.landing_page_ids, event.landing_page_id),
      registrationFormIds: getArrayOrFallback(event.registration_form_ids, event.registration_form_id),
      submissionFormIds: getArrayOrFallback(event.submission_form_ids, event.submission_form_id),
      evaluationFormIds: deserializeArray(event.evaluation_form_ids),
      ...mapEventTemplateFields(event),
      committeeIds: deserializeArray(event.committee_ids),
      evaluationEnabled: Boolean(event.evaluation_enabled),
      banner: event.banner ? (typeof event.banner === 'string' ? JSON.parse(event.banner) : event.banner) : undefined,
      publishStatus: (event.publish_status as 'Draft' | 'Published' | 'Closed') || 'Draft',
      registrationDeadline: event.registration_deadline || undefined,
      submissionDeadline: event.submission_deadline || undefined,
      submissionWorkflowPreset: (event.submission_workflow_preset as 'A' | 'B' | 'C' | 'D') || undefined,
      abstractSubmissionFormIds: deserializeArray(event.abstract_submission_form_ids) as string[],
      abstractSubmissionDeadline: event.abstract_submission_deadline || undefined,
      paymentDeadline: event.payment_deadline || undefined,
      registrationWorkflowPreset: (event.registration_workflow_preset as 'A' | 'B') || undefined,
      registrationPaymentOfferId: event.registration_payment_offer_id || undefined,
      submissionPaymentOfferId: event.submission_payment_offer_id || undefined,
      submissionPaymentFormId: event.submission_payment_form_id || undefined,
      publishedProgramId: event.published_program_id || undefined,
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting available events:', error);
    throw error;
  }
};

/**
 * Fetch only the events a participant needs (by id), with slim columns for pipeline UI.
 */
export const getParticipantEventsByIds = async (eventIds: string[]): Promise<Event[]> => {
  try {
    const uniqueIds = [...new Set(eventIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select(PARTICIPANT_EVENT_LIST_COLUMNS)
      .in('id', uniqueIds)
      .in('publish_status', ['Published', 'Closed']);

    if (error) {
      throw error;
    }

    return (data || [])
      .map((row) => mapParticipantEventRow(row as Record<string, unknown>))
      .filter(isPublishedParticipantEvent);
  } catch (error: any) {
    console.error('Error getting participant events by ids:', error);
    throw error;
  }
};

