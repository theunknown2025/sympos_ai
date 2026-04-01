import { supabase, TABLES } from '../supabase';

export interface CVSection {
  id: string;
  type: string;
  title: string;
  order: number;
  data: any; // Flexible data structure for different section types
}

export interface CV {
  id: string;
  userId: string;
  title: string;
  profileImage?: string;
  sections: CVSection[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Save or update a CV
 */
export const saveCV = async (
  userId: string,
  cv: Omit<CV, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<CV> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const cvData: any = {
      user_id: userId,
      title: cv.title,
      profile_image: cv.profileImage || null,
      sections: JSON.stringify(cv.sections),
      updated_at: new Date().toISOString(),
    };

    if (cv.id) {
      // Update existing CV
      const { data, error } = await supabase
        .from(TABLES.CVS)
        .update(cvData)
        .eq('id', cv.id)
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
        sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } else {
      // Create new CV
      cvData.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from(TABLES.CVS)
        .insert(cvData)
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
        sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    }
  } catch (error: any) {
    console.error('Error saving CV:', error);
    throw new Error(error.message || 'Failed to save CV');
  }
};

/**
 * Get all CVs for a user
 */
export const getCVs = async (userId: string): Promise<CV[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CVS)
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
      sections: typeof item.sections === 'string' ? JSON.parse(item.sections) : item.sections,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  } catch (error: any) {
    console.error('Error fetching CVs:', error);
    throw new Error(error.message || 'Failed to fetch CVs');
  }
};

/**
 * Get a single CV by ID
 */
export const getCV = async (cvId: string, userId: string): Promise<CV | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CVS)
      .select('*')
      .eq('id', cvId)
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
      sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error fetching CV:', error);
    throw new Error(error.message || 'Failed to fetch CV');
  }
};

/**
 * Delete a CV
 */
export const deleteCV = async (cvId: string, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLES.CVS)
      .delete()
      .eq('id', cvId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting CV:', error);
    throw new Error(error.message || 'Failed to delete CV');
  }
};
