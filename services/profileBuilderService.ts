import { supabase, TABLES } from '../supabase';

export interface ProfileSection {
  id: string;
  type: string;
  title: string;
  order: number;
  data: any; // Flexible data structure for different section types
}

export interface ProfileDesign {
  // Component Colors
  colors?: {
    tabs?: {
      main?: string;
      hover?: string;
      active?: string;
      text?: string;
    };
    titles?: string;
    subtitles?: string;
    dates?: string;
    links?: string;
    borders?: string;
  };
  // Background
  background?: {
    type?: 'color' | 'gradient' | 'image';
    color?: string;
    gradient?: {
      from?: string;
      to?: string;
      direction?: string; // e.g., 'to right', 'to bottom', etc.
    };
    image?: string;
  };
  // Banner Header
  banner?: {
    type?: 'color' | 'gradient' | 'image';
    color?: string;
    gradient?: {
      from?: string;
      to?: string;
      direction?: string;
    };
    image?: string;
  };
  // Tabs Layout Settings
  tabsLayout?: {
    orientation?: 'horizontal' | 'vertical';
    display?: 'full' | 'per-section';
  };
  // Language/Direction Settings
  language?: {
    code?: 'en' | 'fr' | 'ar';
    direction?: 'ltr' | 'rtl';
  };
  // Section Colors (per section)
  sections?: Record<string, {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
  }>;
  // Template selection
  template?: 'default' | 'advanced' | 'advanced2';
}

export interface ProfessorProfile {
  id: string;
  userId: string;
  title: string;
  profileImage?: string;
  generalInfo?: {
    firstName?: string;
    lastName?: string;
    title?: string; // Prof., Dr., etc.
    email?: string;
    phone?: string;
    address?: string;
    organization?: string;
    position?: string;
    bio?: string;
    links?: Array<{
      id: string;
      platform: string;
      url: string;
    }>;
  };
  sections: ProfileSection[];
  design?: ProfileDesign;
  isPublished?: boolean;
  publicSlug?: string;
  publishedUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Save or update a Professor Profile
 */
export const saveProfile = async (
  userId: string,
  profile: Omit<ProfessorProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<ProfessorProfile> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const profileData: any = {
      user_id: userId,
      title: profile.title,
      profile_image: profile.profileImage || null,
      general_info: profile.generalInfo ? JSON.stringify(profile.generalInfo) : null,
      sections: JSON.stringify(profile.sections),
      design: profile.design ? JSON.stringify(profile.design) : null,
      is_published: profile.isPublished || false,
      public_slug: profile.publicSlug || null,
      published_url: profile.publishedUrl || null,
      updated_at: new Date().toISOString(),
    };

    if (profile.id) {
      // Update existing profile
      const { data, error } = await supabase
        .from(TABLES.PROFESSOR_PROFILES || 'professor_profiles')
        .update(profileData)
        .eq('id', profile.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        profileImage: data.profile_image,
        generalInfo: data.general_info ? (typeof data.general_info === 'string' ? JSON.parse(data.general_info) : data.general_info) : undefined,
        sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections,
        design: data.design ? (typeof data.design === 'string' ? JSON.parse(data.design) : data.design) : undefined,
        isPublished: data.is_published || false,
        publicSlug: data.public_slug || undefined,
        publishedUrl: data.published_url || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } else {
      // Create new profile
      profileData.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from(TABLES.PROFESSOR_PROFILES || 'professor_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        profileImage: data.profile_image,
        generalInfo: data.general_info ? (typeof data.general_info === 'string' ? JSON.parse(data.general_info) : data.general_info) : undefined,
        sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections,
        design: data.design ? (typeof data.design === 'string' ? JSON.parse(data.design) : data.design) : undefined,
        isPublished: data.is_published || false,
        publicSlug: data.public_slug || undefined,
        publishedUrl: data.published_url || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    }
  } catch (error: any) {
    console.error('Error saving profile:', error);
    throw new Error(error.message || 'Failed to save profile');
  }
};

/**
 * Get all profiles for a user
 */
export const getProfiles = async (userId: string): Promise<ProfessorProfile[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROFESSOR_PROFILES || 'professor_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      profileImage: item.profile_image,
      generalInfo: item.general_info ? (typeof item.general_info === 'string' ? JSON.parse(item.general_info) : item.general_info) : undefined,
      sections: typeof item.sections === 'string' ? JSON.parse(item.sections) : item.sections,
      design: item.design ? (typeof item.design === 'string' ? JSON.parse(item.design) : item.design) : undefined,
      isPublished: item.is_published || false,
      publicSlug: item.public_slug || undefined,
      publishedUrl: item.published_url || undefined,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error: any) {
    console.error('Error fetching profiles:', error);
    throw new Error(error.message || 'Failed to fetch profiles');
  }
};

/**
 * Get a single profile by ID
 */
export const getProfile = async (profileId: string, userId: string): Promise<ProfessorProfile | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROFESSOR_PROFILES || 'professor_profiles')
      .select('*')
      .eq('id', profileId)
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
      title: data.title,
      profileImage: data.profile_image,
      generalInfo: data.general_info ? (typeof data.general_info === 'string' ? JSON.parse(data.general_info) : data.general_info) : undefined,
      sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections,
      design: data.design ? (typeof data.design === 'string' ? JSON.parse(data.design) : data.design) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    throw new Error(error.message || 'Failed to fetch profile');
  }
};

/**
 * Delete a profile
 */
export const deleteProfile = async (profileId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLES.PROFESSOR_PROFILES || 'professor_profiles')
      .delete()
      .eq('id', profileId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting profile:', error);
    throw new Error(error.message || 'Failed to delete profile');
  }
};

/**
 * Get a published profile by public slug (public access, no auth required)
 */
export const getPublishedProfileBySlug = async (slug: string): Promise<ProfessorProfile | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROFESSOR_PROFILES || 'professor_profiles')
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
      title: data.title,
      profileImage: data.profile_image,
      generalInfo: data.general_info ? (typeof data.general_info === 'string' ? JSON.parse(data.general_info) : data.general_info) : undefined,
      sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections,
      design: data.design ? (typeof data.design === 'string' ? JSON.parse(data.design) : data.design) : undefined,
      isPublished: data.is_published || false,
      publicSlug: data.public_slug || undefined,
      publishedUrl: data.published_url || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error fetching published profile:', error);
    throw new Error(error.message || 'Failed to fetch published profile');
  }
};

/**
 * Get all published profiles (public access, no auth required)
 */
export const getPublishedProfiles = async (): Promise<ProfessorProfile[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROFESSOR_PROFILES || 'professor_profiles')
      .select('*')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      title: item.title,
      profileImage: item.profile_image,
      generalInfo: item.general_info ? (typeof item.general_info === 'string' ? JSON.parse(item.general_info) : item.general_info) : undefined,
      sections: typeof item.sections === 'string' ? JSON.parse(item.sections) : item.sections,
      design: item.design ? (typeof item.design === 'string' ? JSON.parse(item.design) : item.design) : undefined,
      isPublished: item.is_published || false,
      publicSlug: item.public_slug || undefined,
      publishedUrl: item.published_url || undefined,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error: any) {
    console.error('Error fetching published profiles:', error);
    throw new Error(error.message || 'Failed to fetch published profiles');
  }
};
