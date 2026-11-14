import { supabase, TABLES } from '../../../../../supabase';
import { CommitteeInvitation } from '../../../../../types';
import { mapDbInvitation } from '../../../../../services/committeeInvitationService';

const INVITATIONS_TABLE = TABLES.COMMITTEE_INVITATIONS;

export async function getOrganizerParticipantInvitations(
  organizerUserId: string
): Promise<CommitteeInvitation[]> {
  const { data, error } = await supabase
    .from(INVITATIONS_TABLE)
    .select('*')
    .eq('invited_by', organizerUserId)
    .eq('invitation_type', 'participant')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => mapDbInvitation(row));
}
