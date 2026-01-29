import { supabase, TABLES } from '../supabase';
import { OrganizerProfile, OrganizerProfileLink } from '../types';

const TABLE_NAME = TABLES.ORGANIZER_PROFILES;

/**
 * Save or update organizer profile
 */
export const saveOrganizerProfile = async (
  userId: string,
  profile: Omit<OrganizerProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check if profile exists
    const { data: existing } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('user_id', userId)
      .single();

    const profileData: any = {
      user_id: userId,
      entity_logo: profile.entityLogo || null,
      entity_banner: profile.entityBanner || null,
      entity_name: profile.entityName || null,
      entity_email: profile.entityEmail || null,
      entity_phone: profile.entityPhone || null,
      entity_address: profile.entityAddress || null,
      entity_websites: JSON.stringify(profile.entityWebsites || []),
      entity_links: JSON.stringify(profile.entityLinks || []),
      representative_full_name: profile.representativeFullName || null,
      representative_email: profile.representativeEmail || null,
      representative_phone: profile.representativePhone || null,
      representative_address: profile.representativeAddress || null,
      representative_function: profile.representativeFunction || null,
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

      if (error) throw error;
      return data.id;
    } else {
      // Create new profile
      profileData.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    }
  } catch (error: any) {
    console.error('Error saving organizer profile:', error);
    throw new Error(error.message || 'Failed to save profile');
  }
};

/**
 * Get organizer profile by user ID
 */
export const getOrganizerProfile = async (userId: string): Promise<OrganizerProfile | null> => {
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
      entityLogo: data.entity_logo,
      entityBanner: data.entity_banner,
      entityName: data.entity_name,
      entityEmail: data.entity_email,
      entityPhone: data.entity_phone,
      entityAddress: data.entity_address,
      entityWebsites: data.entity_websites ? (typeof data.entity_websites === 'string' ? JSON.parse(data.entity_websites) : data.entity_websites) : [],
      entityLinks: data.entity_links ? (typeof data.entity_links === 'string' ? JSON.parse(data.entity_links) : data.entity_links) : [],
      representativeFullName: data.representative_full_name,
      representativeEmail: data.representative_email,
      representativePhone: data.representative_phone,
      representativeAddress: data.representative_address,
      representativeFunction: data.representative_function,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting organizer profile:', error);
    throw error;
  }
};

/**
 * Delete organizer profile
 */
export const deleteOrganizerProfile = async (profileId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', profileId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting organizer profile:', error);
    throw new Error(error.message || 'Failed to delete profile');
  }
};
