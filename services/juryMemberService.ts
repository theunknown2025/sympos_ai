import { supabase, TABLES } from '../supabase';
import { JuryMember, CommitteeInvitation, InvitationStatus, EventAttendance } from '../types';

const TABLE_NAME = TABLES.JURY_MEMBERS;
const INVITATIONS_TABLE = TABLES.COMMITTEE_INVITATIONS;
const ATTENDANCE_TABLE = TABLES.EVENT_ATTENDANCE;

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

    // Deserialize JSON fields
    const affiliation = data.affiliation ? JSON.parse(data.affiliation as string) : {};
    const researchDomains = data.research_domains ? JSON.parse(data.research_domains as string) : [];
    const identifiers = data.links ? JSON.parse(data.links as string) : {};

    return {
      id: data.id,
      userId: data.user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      title: data.title,
      gender: data.gender,
      nationality: data.nationality,
      email: data.email,
      phone: data.phone,
      address: data.address,
      preferredLanguage: data.preferred_language,
      affiliation,
      researchDomains,
      identifiers,
      profileCompleted: data.profile_completed || false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
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

    return data.map((inv) => ({
      id: inv.id,
      juryMemberId: inv.jury_member_id,
      juryMemberEmail: inv.jury_member_email,
      invitedBy: inv.invited_by,
      status: inv.status as InvitationStatus,
      commentary: inv.commentary,
      createdAt: new Date(inv.created_at),
      respondedAt: inv.responded_at ? new Date(inv.responded_at) : undefined,
    }));
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
  commentary?: string
): Promise<void> => {
  try {
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
export const getAvailableEvents = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*')
      .in('publish_status', ['Published', 'Closed'])
      .order('created_at', { ascending: false });

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
      certificateTemplateIds: deserializeArray(event.certificate_template_ids),
      committeeIds: deserializeArray(event.committee_ids),
      banner: event.banner ? (typeof event.banner === 'string' ? JSON.parse(event.banner) : event.banner) : undefined,
      publishStatus: (event.publish_status as 'Draft' | 'Published' | 'Closed') || 'Draft',
      createdAt: new Date(event.created_at),
      updatedAt: new Date(event.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting available events:', error);
    throw error;
  }
};

