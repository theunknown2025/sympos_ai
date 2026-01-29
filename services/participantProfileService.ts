import { supabase, TABLES } from '../supabase';
import { ParticipantProfile, ParticipantProfileLink } from '../types';

const TABLE_NAME = TABLES.PARTICIPANT_PROFILES; // 'participant_profiles'

/**
 * Save or update participant profile
 */
export const saveParticipantProfile = async (
  userId: string,
  profile: Omit<ParticipantProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Verify we're using the correct table
    console.log('Saving to table:', TABLE_NAME); // Should log 'participant_profiles'

    // Check if profile exists
    const { data: existing } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('user_id', userId)
      .single();

    // Prepare profile data for database
    // Handle arrays: if undefined, use empty array, then stringify
    const websitesArray = profile.websites || [];
    const linksArray = profile.links || [];
    const otherLinksArray = profile.otherLinks || [];
    
    const profileData: any = {
      user_id: userId,
      profile_picture: profile.profilePicture || null,
      full_name: profile.fullName || null,
      email: profile.email || null,
      phone: profile.phone || null,
      address: profile.address || null,
      title: profile.title || null,
      position: profile.position || null,
      organization: profile.organization || null,
      bio: profile.bio || null,
      website: profile.website || null,
      websites: JSON.stringify(websitesArray),
      links: JSON.stringify(linksArray),
      orcid_id: profile.orcidId || null,
      google_scholar: profile.googleScholar || null,
      research_gate: profile.researchGate || null,
      other_links: JSON.stringify(otherLinksArray),
      country: profile.country || null,
      city: profile.city || null,
      timezone: profile.timezone || null,
      updated_at: new Date().toISOString(),
    };
    
    // Log the data being saved for debugging
    console.log('Saving participant profile data:', {
      table: TABLE_NAME,
      userId,
      hasProfilePicture: !!profile.profilePicture,
      fullName: profile.fullName,
      email: profile.email,
      websitesCount: websitesArray.length,
      linksCount: linksArray.length,
    });

    if (existing) {
      // Update existing profile
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(profileData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating participant profile:', error);
        throw error;
      }
      console.log('Successfully updated participant profile:', data.id);
      return data.id;
    } else {
      // Create new profile
      profileData.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting participant profile:', error);
        throw error;
      }
      console.log('Successfully created participant profile:', data.id);
      return data.id;
    }
  } catch (error: any) {
    console.error('Error saving participant profile:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(error.message || 'Failed to save profile');
  }
};

/**
 * Get participant profile by user ID
 */
export const getParticipantProfile = async (userId: string): Promise<ParticipantProfile | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
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

    return {
      id: data.id,
      userId: data.user_id,
      profilePicture: data.profile_picture,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      title: data.title,
      position: data.position,
      organization: data.organization,
      bio: data.bio,
      website: data.website,
      websites: data.websites ? (typeof data.websites === 'string' ? JSON.parse(data.websites) : data.websites) : [],
      links: data.links ? (typeof data.links === 'string' ? JSON.parse(data.links) : data.links) : [],
      orcidId: data.orcid_id,
      googleScholar: data.google_scholar,
      researchGate: data.research_gate,
      otherLinks: data.other_links ? (typeof data.other_links === 'string' ? JSON.parse(data.other_links) : data.other_links) : [],
      country: data.country,
      city: data.city,
      timezone: data.timezone,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting participant profile:', error);
    throw error;
  }
};

/**
 * Delete participant profile
 */
export const deleteParticipantProfile = async (profileId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', profileId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting participant profile:', error);
    throw new Error(error.message || 'Failed to delete profile');
  }
};
