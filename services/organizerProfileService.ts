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
      entity_creation_date: profile.entityCreationDate || null,
      entity_legal_status: profile.entityLegalStatus || null,
      entity_country: profile.entityCountry || null,
      entity_city: profile.entityCity || null,
      entity_official_website: profile.entityOfficialWebsite || null,
      entity_email: profile.entityEmail || null,
      entity_phone: profile.entityPhone || null,
      entity_address: profile.entityAddress || null,
      entity_websites: JSON.stringify(profile.entityWebsites || []),
      entity_links: JSON.stringify(profile.entityLinks || []),
      entity_mission: profile.entityMission || null,
      entity_vision: profile.entityVision || null,
      entity_scientific_domains: JSON.stringify(profile.entityScientificDomains || []),
      representative_photo: profile.representativePhoto || null,
      representative_full_name: profile.representativeFullName || null,
      representative_email: profile.representativeEmail || null,
      representative_phone: profile.representativePhone || null,
      representative_address: profile.representativeAddress || null,
      representative_function: profile.representativeFunction || null,
      show_committees: profile.showCommittees || false,
      show_events: profile.showEvents || false,
      show_blog_articles: profile.showBlogArticles || false,
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
      entityCreationDate: data.entity_creation_date,
      entityLegalStatus: data.entity_legal_status,
      entityCountry: data.entity_country,
      entityCity: data.entity_city,
      entityOfficialWebsite: data.entity_official_website,
      entityEmail: data.entity_email,
      entityPhone: data.entity_phone,
      entityAddress: data.entity_address,
      entityWebsites: data.entity_websites ? (typeof data.entity_websites === 'string' ? JSON.parse(data.entity_websites) : data.entity_websites) : [],
      entityLinks: data.entity_links ? (typeof data.entity_links === 'string' ? JSON.parse(data.entity_links) : data.entity_links) : [],
      entityMission: data.entity_mission,
      entityVision: data.entity_vision,
      entityScientificDomains: data.entity_scientific_domains ? (typeof data.entity_scientific_domains === 'string' ? JSON.parse(data.entity_scientific_domains) : data.entity_scientific_domains) : [],
      representativePhoto: data.representative_photo,
      representativeFullName: data.representative_full_name,
      representativeEmail: data.representative_email,
      representativePhone: data.representative_phone,
      representativeAddress: data.representative_address,
      representativeFunction: data.representative_function,
      isPublished: data.is_published || false,
      publicSlug: data.public_slug || undefined,
      publishedUrl: data.public_slug ? (typeof window !== 'undefined' ? `${window.location.origin}/profile/${data.public_slug}` : `/profile/${data.public_slug}`) : undefined,
      showCommittees: data.show_committees || false,
      showEvents: data.show_events || false,
      showBlogArticles: data.show_blog_articles || false,
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

/**
 * Generate a unique slug from entity name
 */
const generateSlug = (entityName: string, profileId: string): string => {
  if (!entityName) {
    return `profile-${profileId.substring(0, 8)}`;
  }
  
  // Convert to lowercase, replace spaces and special chars with hyphens
  let slug = entityName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  // Add first 8 chars of profile ID for uniqueness
  slug = `${slug}-${profileId.substring(0, 8)}`;
  
  return slug;
};

/**
 * Get organizer profile by profile ID
 */
export const getOrganizerProfileById = async (profileId: string): Promise<OrganizerProfile | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', profileId)
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
      entityCreationDate: data.entity_creation_date,
      entityLegalStatus: data.entity_legal_status,
      entityCountry: data.entity_country,
      entityCity: data.entity_city,
      entityOfficialWebsite: data.entity_official_website,
      entityEmail: data.entity_email,
      entityPhone: data.entity_phone,
      entityAddress: data.entity_address,
      entityWebsites: data.entity_websites ? (typeof data.entity_websites === 'string' ? JSON.parse(data.entity_websites) : data.entity_websites) : [],
      entityLinks: data.entity_links ? (typeof data.entity_links === 'string' ? JSON.parse(data.entity_links) : data.entity_links) : [],
      entityMission: data.entity_mission,
      entityVision: data.entity_vision,
      entityScientificDomains: data.entity_scientific_domains ? (typeof data.entity_scientific_domains === 'string' ? JSON.parse(data.entity_scientific_domains) : data.entity_scientific_domains) : [],
      representativePhoto: data.representative_photo,
      representativeFullName: data.representative_full_name,
      representativeEmail: data.representative_email,
      representativePhone: data.representative_phone,
      representativeAddress: data.representative_address,
      representativeFunction: data.representative_function,
      isPublished: data.is_published || false,
      publicSlug: data.public_slug || undefined,
      publishedUrl: data.public_slug ? (typeof window !== 'undefined' ? `${window.location.origin}/profile/${data.public_slug}` : `/profile/${data.public_slug}`) : undefined,
      showCommittees: data.show_committees || false,
      showEvents: data.show_events || false,
      showBlogArticles: data.show_blog_articles || false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting organizer profile by ID:', error);
    throw error;
  }
};

/**
 * Publish an organizer profile (makes it publicly accessible)
 */
export const publishOrganizerProfile = async (profileId: string): Promise<string> => {
  try {
    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    // Get the profile to generate slug from entity name
    const profile = await getOrganizerProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Generate a unique slug
    const slug = generateSlug(profile.entityName || 'profile', profileId);

    // Check if slug already exists for another profile
    const { data: existingProfile } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('public_slug', slug)
      .neq('id', profileId)
      .single();

    // If slug exists, append more characters from profileId to make it unique
    const finalSlug = existingProfile ? `${slug}-${profileId.substring(8, 16)}` : slug;

    // Update the profile to mark it as published
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        is_published: true,
        public_slug: finalSlug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (error) {
      throw error;
    }

    return typeof window !== 'undefined' ? `${window.location.origin}/profile/${finalSlug}` : `/profile/${finalSlug}`;
  } catch (error: any) {
    console.error('Error publishing organizer profile:', error);
    throw new Error(error.message || 'Failed to publish profile');
  }
};

/**
 * Unpublish an organizer profile (makes it private)
 */
export const unpublishOrganizerProfile = async (profileId: string): Promise<void> => {
  try {
    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    // Update the profile to mark it as unpublished
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        is_published: false,
        public_slug: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error unpublishing organizer profile:', error);
    throw new Error(error.message || 'Failed to unpublish profile');
  }
};

/**
 * Get a published organizer profile by slug (public access)
 */
export const getPublishedOrganizerProfile = async (slug: string): Promise<OrganizerProfile | null> => {
  try {
    if (!slug) {
      throw new Error('Slug is required');
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('public_slug', slug)
      .eq('is_published', true)
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
      entityCreationDate: data.entity_creation_date,
      entityLegalStatus: data.entity_legal_status,
      entityCountry: data.entity_country,
      entityCity: data.entity_city,
      entityOfficialWebsite: data.entity_official_website,
      entityEmail: data.entity_email,
      entityPhone: data.entity_phone,
      entityAddress: data.entity_address,
      entityWebsites: data.entity_websites ? (typeof data.entity_websites === 'string' ? JSON.parse(data.entity_websites) : data.entity_websites) : [],
      entityLinks: data.entity_links ? (typeof data.entity_links === 'string' ? JSON.parse(data.entity_links) : data.entity_links) : [],
      entityMission: data.entity_mission,
      entityVision: data.entity_vision,
      entityScientificDomains: data.entity_scientific_domains ? (typeof data.entity_scientific_domains === 'string' ? JSON.parse(data.entity_scientific_domains) : data.entity_scientific_domains) : [],
      representativePhoto: data.representative_photo,
      representativeFullName: data.representative_full_name,
      representativeEmail: data.representative_email,
      representativePhone: data.representative_phone,
      representativeAddress: data.representative_address,
      representativeFunction: data.representative_function,
      isPublished: true,
      publicSlug: data.public_slug,
      publishedUrl: typeof window !== 'undefined' ? `${window.location.origin}/profile/${data.public_slug}` : `/profile/${data.public_slug}`,
      showCommittees: data.show_committees || false,
      showEvents: data.show_events || false,
      showBlogArticles: data.show_blog_articles || false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting published organizer profile:', error);
    throw error;
  }
};
