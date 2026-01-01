import { supabase, TABLES } from '../supabase';
import { ConferenceConfig } from '../types';

export interface SavedLandingPage {
  id: string;
  userId: string;
  title: string;
  config: ConferenceConfig;
  createdAt: Date;
  updatedAt: Date;
}

const TABLE_NAME = TABLES.LANDING_PAGES;

/**
 * Remove undefined values from an object recursively
 * Supabase doesn't accept undefined values
 */
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = removeUndefined(value);
        }
      }
    }
    return cleaned;
  }
  
  return obj;
};

/**
 * Validate and clean the config before saving
 */
const validateAndCleanConfig = (config: ConferenceConfig): ConferenceConfig => {
  // Ensure all required fields exist
  const cleaned = {
    ...config,
    // Ensure sections have titleAlignment
    sections: config.sections.map(section => ({
      ...section,
      titleAlignment: section.titleAlignment || 'center'
    })),
    // Ensure about config exists if needed
    about: config.about || {
      includeImage: false,
      imageUrl: '',
      layout: 'top'
    }
  };
  
  return removeUndefined(cleaned) as ConferenceConfig;
};

/**
 * Save a new landing page
 */
export const saveLandingPage = async (
  userId: string,
  title: string,
  config: ConferenceConfig
): Promise<string> => {
  try {
    if (!title || !title.trim()) {
      throw new Error('Title is required');
    }
    
    if (!config) {
      throw new Error('Configuration is required');
    }
    
    const cleanedConfig = validateAndCleanConfig(config);
    
    // Serialize config to JSON string for Supabase storage
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        user_id: userId,
        title: title.trim(),
        config: JSON.stringify(cleanedConfig),
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data.id;
  } catch (error: any) {
    console.error('Error saving landing page:', error);
    throw new Error(error.message || 'Failed to save landing page');
  }
};

/**
 * Update an existing landing page
 */
export const updateLandingPage = async (
  pageId: string,
  title: string,
  config: ConferenceConfig
): Promise<void> => {
  try {
    if (!pageId) {
      throw new Error('Page ID is required');
    }
    
    if (!title || !title.trim()) {
      throw new Error('Title is required');
    }
    
    if (!config) {
      throw new Error('Configuration is required');
    }
    
    const cleanedConfig = validateAndCleanConfig(config);
    
    // Serialize config to JSON string for Supabase storage
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        title: title.trim(),
        config: JSON.stringify(cleanedConfig),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating landing page:', error);
    throw new Error(error.message || 'Failed to update landing page');
  }
};

/**
 * Get a single landing page by ID
 */
export const getLandingPage = async (pageId: string): Promise<SavedLandingPage | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', pageId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      throw error;
    }
    
    if (!data) {
      return null;
    }
    
    // Deserialize config from JSON string
    const config = typeof data.config === 'string' 
      ? JSON.parse(data.config) 
      : data.config;
    
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      config: config as ConferenceConfig,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting landing page:', error);
    throw error;
  }
};

/**
 * Get all landing pages for a user
 */
export const getUserLandingPages = async (userId: string): Promise<SavedLandingPage[]> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    return data.map(doc => {
      try {
        // Deserialize config from JSON string
        const config = typeof doc.config === 'string' 
          ? JSON.parse(doc.config) 
          : doc.config;
        
        return {
          id: doc.id,
          userId: doc.user_id,
          title: doc.title,
          config: config as ConferenceConfig,
          createdAt: new Date(doc.created_at),
          updatedAt: new Date(doc.updated_at),
        };
      } catch (parseError) {
        console.error('Error parsing config for document:', doc.id, parseError);
        // Return a default config if parsing fails
        return {
          id: doc.id,
          userId: doc.user_id,
          title: doc.title || 'Untitled',
          config: {} as ConferenceConfig,
          createdAt: new Date(doc.created_at),
          updatedAt: new Date(doc.updated_at),
        };
      }
    });
  } catch (error: any) {
    console.error('Error getting user landing pages:', error);
    throw new Error(error.message || 'Failed to load landing pages');
  }
};

/**
 * Delete a landing page
 */
export const deleteLandingPage = async (pageId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', pageId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting landing page:', error);
    throw new Error(error.message || 'Failed to delete landing page');
  }
};
