import { supabase, TABLES } from '../supabase';
import { ConferenceConfig } from '../types';

export interface SavedLandingPage {
  id: string;
  userId: string;
  title: string;
  config: ConferenceConfig;
  createdAt: Date;
  updatedAt: Date;
  isPublished?: boolean;
  publicSlug?: string;
  publishedUrl?: string;
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
      isPublished: data.is_published || false,
      publicSlug: data.public_slug || undefined,
      publishedUrl: data.public_slug ? (typeof window !== 'undefined' ? `${window.location.origin}/p/${data.public_slug}` : `/p/${data.public_slug}`) : undefined,
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
          isPublished: doc.is_published || false,
          publicSlug: doc.public_slug || undefined,
          publishedUrl: doc.public_slug ? (typeof window !== 'undefined' ? `${window.location.origin}/p/${doc.public_slug}` : `/p/${doc.public_slug}`) : undefined,
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
          isPublished: doc.is_published || false,
          publicSlug: doc.public_slug || undefined,
          publishedUrl: doc.public_slug ? (typeof window !== 'undefined' ? `${window.location.origin}/p/${doc.public_slug}` : `/p/${doc.public_slug}`) : undefined,
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
 * This function handles the foreign key constraint by removing the landing page
 * from all events that reference it before deletion.
 */
export const deleteLandingPage = async (pageId: string): Promise<void> => {
  try {
    // Step 1: Find all events that reference this landing page
    // First, get events where landing_page_id matches (old column)
    const { data: eventsByOldColumn, error: fetchError1 } = await supabase
      .from(TABLES.EVENTS)
      .select('id, landing_page_id, landing_page_ids')
      .eq('landing_page_id', pageId);
    
    if (fetchError1) {
      throw fetchError1;
    }
    
    // Step 2: Get all events and filter for those with the ID in the array column
    // We need to fetch all events and filter in memory since Supabase doesn't have
    // a direct JSON array contains operator
    const { data: allEvents, error: fetchError2 } = await supabase
      .from(TABLES.EVENTS)
      .select('id, landing_page_id, landing_page_ids');
    
    if (fetchError2) {
      throw fetchError2;
    }
    
    // Combine events from both queries and deduplicate
    const eventsToUpdate = new Map<string, any>();
    
    // Add events from old column query
    if (eventsByOldColumn) {
      eventsByOldColumn.forEach(event => {
        eventsToUpdate.set(event.id, event);
      });
    }
    
    // Add events from array column that contain the pageId
    if (allEvents) {
      allEvents.forEach(event => {
        if (event.landing_page_ids) {
          try {
            const landingPageIds = typeof event.landing_page_ids === 'string'
              ? JSON.parse(event.landing_page_ids)
              : event.landing_page_ids;
            
            if (Array.isArray(landingPageIds) && landingPageIds.includes(pageId)) {
              eventsToUpdate.set(event.id, event);
            }
          } catch (parseError) {
            // Skip events with invalid JSON
            console.warn('Error parsing landing_page_ids for event:', event.id, parseError);
          }
        }
      });
    }
    
    // Step 3: Remove the landing page ID from all referencing events
    for (const event of eventsToUpdate.values()) {
      const updateData: any = {};
      let needsUpdate = false;
      
      // Remove from old single column if it matches
      if (event.landing_page_id === pageId) {
        updateData.landing_page_id = null;
        needsUpdate = true;
      }
      
      // Remove from new array column if it contains the ID
      if (event.landing_page_ids) {
        try {
          const landingPageIds = typeof event.landing_page_ids === 'string'
            ? JSON.parse(event.landing_page_ids)
            : event.landing_page_ids;
          
          if (Array.isArray(landingPageIds) && landingPageIds.includes(pageId)) {
            const filteredIds = landingPageIds.filter((id: string) => id !== pageId);
            updateData.landing_page_ids = JSON.stringify(filteredIds);
            needsUpdate = true;
            
            // If array is not empty, also update the old column with the first value
            if (filteredIds.length > 0) {
              updateData.landing_page_id = filteredIds[0];
            } else if (!updateData.landing_page_id) {
              // Only set to null if we haven't already set it above
              updateData.landing_page_id = null;
            }
          }
        } catch (parseError) {
          console.error('Error parsing landing_page_ids for event:', event.id, parseError);
          // If parsing fails and old column matches, still update it
          if (event.landing_page_id === pageId && !needsUpdate) {
            updateData.landing_page_id = null;
            needsUpdate = true;
          }
        }
      }
      
      // Update the event if we have changes to make
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from(TABLES.EVENTS)
          .update(updateData)
          .eq('id', event.id);
        
        if (updateError) {
          console.error('Error updating event:', event.id, updateError);
          throw updateError;
        }
      }
    }
    
    // Step 4: Now safe to delete the landing page
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

/**
 * Generate a unique slug from title
 */
const generateSlug = (title: string, pageId: string): string => {
  // Create a base slug from title
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  // Add first 8 characters of pageId for uniqueness
  const uniqueId = pageId.substring(0, 8);
  
  return `${baseSlug}-${uniqueId}`;
};

/**
 * Publish a landing page (makes it publicly accessible)
 */
export const publishLandingPage = async (pageId: string): Promise<string> => {
  try {
    if (!pageId) {
      throw new Error('Page ID is required');
    }

    // Get the page to generate slug from title
    const page = await getLandingPage(pageId);
    if (!page) {
      throw new Error('Landing page not found');
    }

    // Generate a unique slug
    const slug = generateSlug(page.title, pageId);

    // Check if slug already exists for another page
    const { data: existingPage } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('public_slug', slug)
      .neq('id', pageId)
      .single();

    // If slug exists, append pageId to make it unique
    const finalSlug = existingPage ? `${slug}-${pageId.substring(0, 8)}` : slug;

    // Update the page to mark it as published
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        is_published: true,
        public_slug: finalSlug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId);

    if (error) {
      throw error;
    }

    return typeof window !== 'undefined' ? `${window.location.origin}/p/${finalSlug}` : `/p/${finalSlug}`;
  } catch (error: any) {
    console.error('Error publishing landing page:', error);
    throw new Error(error.message || 'Failed to publish landing page');
  }
};

/**
 * Unpublish a landing page (makes it private)
 */
export const unpublishLandingPage = async (pageId: string): Promise<void> => {
  try {
    if (!pageId) {
      throw new Error('Page ID is required');
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        is_published: false,
        public_slug: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error unpublishing landing page:', error);
    throw new Error(error.message || 'Failed to unpublish landing page');
  }
};

/**
 * Get a published landing page by slug (public access)
 */
export const getPublishedLandingPage = async (slug: string): Promise<SavedLandingPage | null> => {
  try {
    if (!slug) {
      throw new Error('Slug is required');
    }

    console.log('Fetching published landing page with slug:', slug);
    console.log('Supabase client initialized:', !!supabase);
    console.log('Table name:', TABLE_NAME);
    
    const queryStartTime = Date.now();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('public_slug', slug)
      .eq('is_published', true)
      .single();
    
    const queryDuration = Date.now() - queryStartTime;
    console.log(`Query completed in ${queryDuration}ms`);

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') { // Not found
        console.log('Page not found (PGRST116)');
        return null;
      }
      // Check if it's an RLS policy error
      if (error.message?.includes('policy') || error.message?.includes('permission')) {
        console.error('RLS Policy Error - Public access may not be configured:', error);
        throw new Error('Access denied. Please ensure the RLS policy for public access is configured.');
      }
      throw error;
    }

    if (!data) {
      console.log('No data returned from query');
      return null;
    }

    console.log('Data retrieved successfully:', { id: data.id, title: data.title });

    // Deserialize config from JSON string
    let config: ConferenceConfig;
    try {
      config = typeof data.config === 'string' 
        ? JSON.parse(data.config) 
        : data.config;
    } catch (parseError) {
      console.error('Error parsing config:', parseError);
      throw new Error('Invalid page configuration');
    }

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      config: config as ConferenceConfig,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      isPublished: true,
      publicSlug: data.public_slug,
      publishedUrl: typeof window !== 'undefined' ? `${window.location.origin}/p/${data.public_slug}` : `/p/${data.public_slug}`,
    };
  } catch (error: any) {
    console.error('Error getting published landing page:', error);
    throw error;
  }
};
