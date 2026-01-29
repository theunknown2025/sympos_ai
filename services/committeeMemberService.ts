import { supabase, TABLES } from '../supabase';
import { ReviewCommitteeMember, CommitteeInvitation, InvitationStatus } from '../types';

const TABLE_NAME = TABLES.COMMITTEE_MEMBERS;

/**
 * Save a new committee member
 */
export const saveCommitteeMember = async (
  userId: string,
  member: Omit<ReviewCommitteeMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    // Check if email already exists
    const { data: emailDocs } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('email', member.email)
      .limit(1);
    if (emailDocs && emailDocs.length > 0) {
      throw new Error('A member with this email address already exists');
    }

    // Check if committeeMemberId already exists
    const { data: idDocs } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('committee_member_id', member.committeeMemberId)
      .limit(1);
    if (idDocs && idDocs.length > 0) {
      throw new Error('A member with this ID already exists');
    }

    // Serialize JSON fields for Supabase storage
    const insertData: any = {
      user_id: userId,
      committee_member_id: member.committeeMemberId,
      email: member.email,
      first_name: member.firstName,
      last_name: member.lastName,
      title: member.title,
      gender: member.gender,
      nationality: member.nationality,
      phone: member.phone,
      address: member.address,
      country: member.country,
      position: member.position,
      affiliation: JSON.stringify(member.affiliation || {}),
      research_domains: JSON.stringify(member.researchDomains || []),
      links: JSON.stringify(member.identifiers || {}),
      preferred_languages: JSON.stringify(member.preferredLanguage ? [member.preferredLanguage] : []),
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data.id;
  } catch (error: any) {
    console.error('Error saving committee member:', error);
    throw error;
  }
};

/**
 * Update an existing committee member
 */
export const updateCommitteeMember = async (
  memberId: string,
  member: Partial<Omit<ReviewCommitteeMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    // Get existing member
    const { data: existingMember, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', memberId)
      .single();
    
    if (fetchError || !existingMember) {
      throw new Error('Committee member not found');
    }

    // If email is being updated, check for duplicates
    if (member.email && member.email !== existingMember.email) {
      const { data: emailDocs } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .eq('email', member.email)
        .limit(1);
      const duplicate = emailDocs?.find(doc => doc.id !== memberId);
      if (duplicate) {
        throw new Error('A member with this email address already exists');
      }
    }

    // If committeeMemberId is being updated, check for duplicates
    if (member.committeeMemberId && member.committeeMemberId !== existingMember.committee_member_id) {
      const { data: idDocs } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .eq('committee_member_id', member.committeeMemberId)
        .limit(1);
      const duplicate = idDocs?.find(doc => doc.id !== memberId);
      if (duplicate) {
        throw new Error('A member with this ID already exists');
      }
    }

    // Serialize JSON fields for Supabase storage
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (member.committeeMemberId !== undefined) updateData.committee_member_id = member.committeeMemberId;
    if (member.email !== undefined) updateData.email = member.email;
    if (member.firstName !== undefined) updateData.first_name = member.firstName;
    if (member.lastName !== undefined) updateData.last_name = member.lastName;
    if (member.title !== undefined) updateData.title = member.title;
    if (member.gender !== undefined) updateData.gender = member.gender;
    if (member.nationality !== undefined) updateData.nationality = member.nationality;
    if (member.phone !== undefined) updateData.phone = member.phone;
    if (member.address !== undefined) updateData.address = member.address;
    if (member.country !== undefined) updateData.country = member.country;
    if (member.position !== undefined) updateData.position = member.position;
    
    if (member.affiliation !== undefined) {
      updateData.affiliation = JSON.stringify(member.affiliation);
    }
    if (member.researchDomains !== undefined) {
      updateData.research_domains = JSON.stringify(member.researchDomains);
    }
    if (member.identifiers !== undefined) {
      updateData.links = JSON.stringify(member.identifiers);
    }
    if (member.preferredLanguage !== undefined) {
      updateData.preferred_languages = JSON.stringify([member.preferredLanguage]);
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', memberId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating committee member:', error);
    throw error;
  }
};

/**
 * Get all committee members for a user
 */
export const getCommitteeMembers = async (userId: string): Promise<ReviewCommitteeMember[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    return data.map(doc => {
      // Deserialize JSON fields from Supabase storage
      const affiliation = doc.affiliation ? JSON.parse(doc.affiliation as string) : {};
      const researchDomains = doc.research_domains ? JSON.parse(doc.research_domains as string) : [];
      const links = doc.links ? JSON.parse(doc.links as string) : {};
      const preferredLanguages = doc.preferred_languages ? JSON.parse(doc.preferred_languages as string) : [];
      
      return {
        id: doc.id,
        userId: doc.user_id,
        committeeMemberId: doc.committee_member_id,
        email: doc.email,
        firstName: doc.first_name,
        lastName: doc.last_name,
        title: doc.title,
        gender: doc.gender,
        nationality: doc.nationality,
        phone: doc.phone,
        address: doc.address,
        country: doc.country,
        position: doc.position,
        affiliation,
        researchDomains,
        identifiers: links,
        preferredLanguage: preferredLanguages[0] || undefined,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      } as ReviewCommitteeMember;
    });
  } catch (error) {
    console.error('Error getting committee members:', error);
    throw error;
  }
};

/**
 * Get a single committee member by ID
 */
export const getCommitteeMember = async (memberId: string): Promise<ReviewCommitteeMember | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', memberId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    if (!data) {
      return null;
    }
    
    // Deserialize JSON fields from Supabase storage
    const affiliation = data.affiliation ? JSON.parse(data.affiliation as string) : {};
    const researchDomains = data.research_domains ? JSON.parse(data.research_domains as string) : [];
    const links = data.links ? JSON.parse(data.links as string) : {};
    const preferredLanguages = data.preferred_languages ? JSON.parse(data.preferred_languages as string) : [];
    
    return {
      id: data.id,
      userId: data.user_id,
      committeeMemberId: data.committee_member_id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      title: data.title,
      gender: data.gender,
      nationality: data.nationality,
      phone: data.phone,
      address: data.address,
      country: data.country,
      position: data.position,
      affiliation,
      researchDomains,
      identifiers: links,
      preferredLanguage: preferredLanguages[0] || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    } as ReviewCommitteeMember;
  } catch (error: any) {
    console.error('Error getting committee member:', error);
    throw error;
  }
};

/**
 * Get committee members by their IDs
 */
export const getCommitteeMembersByIds = async (memberIds: string[]): Promise<ReviewCommitteeMember[]> => {
  try {
    if (memberIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .in('id', memberIds);
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    return data.map(doc => {
      // Deserialize JSON fields from Supabase storage
      const affiliation = doc.affiliation ? JSON.parse(doc.affiliation as string) : {};
      const researchDomains = doc.research_domains ? JSON.parse(doc.research_domains as string) : [];
      const links = doc.links ? JSON.parse(doc.links as string) : {};
      const preferredLanguages = doc.preferred_languages ? JSON.parse(doc.preferred_languages as string) : [];
      
      return {
        id: doc.id,
        userId: doc.user_id,
        committeeMemberId: doc.committee_member_id,
        email: doc.email,
        firstName: doc.first_name,
        lastName: doc.last_name,
        title: doc.title,
        gender: doc.gender,
        nationality: doc.nationality,
        phone: doc.phone,
        address: doc.address,
        country: doc.country,
        position: doc.position,
        affiliation,
        researchDomains,
        identifiers: links,
        preferredLanguage: preferredLanguages[0] || undefined,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      } as ReviewCommitteeMember;
    });
  } catch (error: any) {
    console.error('Error getting committee members by IDs:', error);
    throw error;
  }
};

/**
 * Delete a committee member
 */
export const deleteCommitteeMember = async (memberId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', memberId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting committee member:', error);
    throw new Error(error.message || 'Failed to delete committee member');
  }
};

/**
 * Create an invitation for a committee member
 */
export const createMemberInvitation = async (
  memberId: string,
  memberEmail: string,
  invitedBy: string
): Promise<string> => {
  try {
    // Check if jury member exists, if not create one
    let juryMemberId: string;
    const { data: existingJuryMember } = await supabase
      .from(TABLES.JURY_MEMBERS)
      .select('id')
      .eq('email', memberEmail)
      .single();

    if (existingJuryMember) {
      juryMemberId = existingJuryMember.id;
    } else {
      // Create a jury member profile for this committee member
      const member = await getCommitteeMember(memberId);
      if (!member) {
        throw new Error('Committee member not found');
      }

      const { data: newJuryMember, error: juryError } = await supabase
        .from(TABLES.JURY_MEMBERS)
        .insert({
          email: member.email,
          first_name: member.firstName,
          last_name: member.lastName,
          title: member.title,
          gender: member.gender,
          nationality: member.nationality,
          phone: member.phone,
          address: member.address,
          preferred_language: member.preferredLanguage,
          affiliation: JSON.stringify(member.affiliation || {}),
          research_domains: JSON.stringify(member.researchDomains || []),
          links: JSON.stringify(member.identifiers || {}),
          profile_completed: false,
        })
        .select()
        .single();

      if (juryError) {
        throw juryError;
      }

      juryMemberId = newJuryMember.id;
    }

    // Create invitation
    const { data, error } = await supabase
      .from(TABLES.COMMITTEE_INVITATIONS)
      .insert({
        jury_member_id: juryMemberId,
        jury_member_email: memberEmail,
        invited_by: invitedBy,
        status: InvitationStatus.PENDING,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    throw new Error(error.message || 'Failed to create invitation');
  }
};

/**
 * Get all invitations for a committee member
 */
export const getMemberInvitations = async (memberId: string): Promise<CommitteeInvitation[]> => {
  try {
    const member = await getCommitteeMember(memberId);
    if (!member) {
      return [];
    }

    // Find jury member by email
    const { data: juryMember } = await supabase
      .from(TABLES.JURY_MEMBERS)
      .select('id')
      .eq('email', member.email)
      .single();

    if (!juryMember) {
      return [];
    }

    const { data, error } = await supabase
      .from(TABLES.COMMITTEE_INVITATIONS)
      .select('*')
      .eq('jury_member_id', juryMember.id)
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
    console.error('Error getting member invitations:', error);
    return [];
  }
};
