import { supabase, TABLES } from '../supabase';
import { Event, EventPartner, EventDate, EventLink } from '../types';

const TABLE_NAME = TABLES.EVENTS;

/**
 * Remove undefined values from an object recursively
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
 * Save a new event
 */
export const saveEvent = async (
  userId: string,
  event: Omit<Event, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!event.name || !event.name.trim()) {
      throw new Error('Event name is required');
    }
    
    const cleanedEvent = removeUndefined(event);
    
    // Serialize arrays to JSON strings for Supabase storage
    const insertData: any = {
      user_id: userId,
      name: cleanedEvent.name.trim(),
      description: cleanedEvent.description || null,
      location: cleanedEvent.location || null,
    };
    
    // Serialize array fields to JSON strings (new columns)
    insertData.keywords = JSON.stringify(cleanedEvent.keywords || []);
    insertData.fields = JSON.stringify(cleanedEvent.fields || []);
    insertData.partners = JSON.stringify(cleanedEvent.partners || []);
    insertData.dates = JSON.stringify(cleanedEvent.dates || []);
    insertData.links = JSON.stringify(cleanedEvent.links || []);
    insertData.landing_page_ids = JSON.stringify(cleanedEvent.landingPageIds || []);
    insertData.registration_form_ids = JSON.stringify(cleanedEvent.registrationFormIds || []);
    insertData.submission_form_ids = JSON.stringify(cleanedEvent.submissionFormIds || []);
    insertData.evaluation_form_ids = JSON.stringify(cleanedEvent.evaluationFormIds || []);
    insertData.certificate_template_ids = JSON.stringify(cleanedEvent.certificateTemplateIds || []);
    insertData.committee_ids = JSON.stringify(cleanedEvent.committeeIds || []);
    insertData.banner = cleanedEvent.banner ? JSON.stringify(cleanedEvent.banner) : null;
    insertData.publish_status = cleanedEvent.publishStatus || 'Draft';
    
    // Backward compatibility: Also populate old columns with first value from arrays
    // This ensures compatibility during migration period
    if (cleanedEvent.landingPageIds && cleanedEvent.landingPageIds.length > 0) {
      insertData.landing_page_id = cleanedEvent.landingPageIds[0];
    }
    if (cleanedEvent.registrationFormIds && cleanedEvent.registrationFormIds.length > 0) {
      insertData.registration_form_id = cleanedEvent.registrationFormIds[0];
    }
    if (cleanedEvent.submissionFormIds && cleanedEvent.submissionFormIds.length > 0) {
      insertData.submission_form_id = cleanedEvent.submissionFormIds[0];
    }
    
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
    console.error('Error saving event:', error);
    throw new Error(error.message || 'Failed to save event');
  }
};

/**
 * Update an existing event
 */
export const updateEvent = async (
  eventId: string,
  event: Partial<Omit<Event, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    
    const cleanedEvent = removeUndefined(event);
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (cleanedEvent.name !== undefined) updateData.name = cleanedEvent.name.trim();
    if (cleanedEvent.description !== undefined) updateData.description = cleanedEvent.description;
    if (cleanedEvent.location !== undefined) updateData.location = cleanedEvent.location;
    if (cleanedEvent.keywords !== undefined) updateData.keywords = JSON.stringify(cleanedEvent.keywords);
    if (cleanedEvent.fields !== undefined) updateData.fields = JSON.stringify(cleanedEvent.fields);
    if (cleanedEvent.partners !== undefined) updateData.partners = JSON.stringify(cleanedEvent.partners);
    if (cleanedEvent.dates !== undefined) updateData.dates = JSON.stringify(cleanedEvent.dates);
    if (cleanedEvent.links !== undefined) updateData.links = JSON.stringify(cleanedEvent.links);
    if (cleanedEvent.landingPageIds !== undefined) {
      updateData.landing_page_ids = JSON.stringify(cleanedEvent.landingPageIds);
      // Backward compatibility: Also update old column with first value
      if (cleanedEvent.landingPageIds.length > 0) {
        updateData.landing_page_id = cleanedEvent.landingPageIds[0];
      } else {
        updateData.landing_page_id = null;
      }
    }
    if (cleanedEvent.registrationFormIds !== undefined) {
      updateData.registration_form_ids = JSON.stringify(cleanedEvent.registrationFormIds);
      // Backward compatibility: Also update old column with first value
      if (cleanedEvent.registrationFormIds.length > 0) {
        updateData.registration_form_id = cleanedEvent.registrationFormIds[0];
      } else {
        updateData.registration_form_id = null;
      }
    }
    if (cleanedEvent.submissionFormIds !== undefined) {
      updateData.submission_form_ids = JSON.stringify(cleanedEvent.submissionFormIds);
      // Backward compatibility: Also update old column with first value
      if (cleanedEvent.submissionFormIds.length > 0) {
        updateData.submission_form_id = cleanedEvent.submissionFormIds[0];
      } else {
        updateData.submission_form_id = null;
      }
    }
    if (cleanedEvent.evaluationFormIds !== undefined) {
      updateData.evaluation_form_ids = JSON.stringify(cleanedEvent.evaluationFormIds);
    }
    if (cleanedEvent.certificateTemplateIds !== undefined) {
      updateData.certificate_template_ids = JSON.stringify(cleanedEvent.certificateTemplateIds);
    }
    if (cleanedEvent.committeeIds !== undefined) {
      updateData.committee_ids = JSON.stringify(cleanedEvent.committeeIds);
    }
    if (cleanedEvent.banner !== undefined) {
      updateData.banner = cleanedEvent.banner ? JSON.stringify(cleanedEvent.banner) : null;
    }
    if (cleanedEvent.publishStatus !== undefined) {
      updateData.publish_status = cleanedEvent.publishStatus;
    }
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', eventId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating event:', error);
    throw new Error(error.message || 'Failed to update event');
  }
};

/**
 * Get a single event by ID
 */
export const getEvent = async (eventId: string): Promise<Event | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', eventId)
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
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      keywords: deserializeArray(data.keywords) as string[],
      fields: deserializeArray(data.fields) as string[],
      partners: deserializeArray(data.partners) as EventPartner[],
      dates: deserializeArray(data.dates) as EventDate[],
      location: data.location || undefined,
      links: deserializeArray(data.links) as EventLink[],
      landingPageIds: getArrayOrFallback(data.landing_page_ids, data.landing_page_id),
      registrationFormIds: getArrayOrFallback(data.registration_form_ids, data.registration_form_id),
      submissionFormIds: getArrayOrFallback(data.submission_form_ids, data.submission_form_id),
      evaluationFormIds: deserializeArray(data.evaluation_form_ids),
      certificateTemplateIds: deserializeArray(data.certificate_template_ids),
      committeeIds: deserializeArray(data.committee_ids),
      banner: data.banner ? (typeof data.banner === 'string' ? JSON.parse(data.banner) : data.banner) : undefined,
      publishStatus: (data.publish_status as 'Draft' | 'Published' | 'Closed') || 'Draft',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting event:', error);
    throw error;
  }
};

/**
 * Get all events for a user
 */
export const getUserEvents = async (userId: string): Promise<Event[]> => {
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
    
    return data.map(doc => ({
      id: doc.id,
      userId: doc.user_id,
      name: doc.name,
      description: doc.description,
      keywords: deserializeArray(doc.keywords) as string[],
      fields: deserializeArray(doc.fields) as string[],
      partners: deserializeArray(doc.partners) as EventPartner[],
      dates: deserializeArray(doc.dates) as EventDate[],
      location: doc.location || undefined,
      links: deserializeArray(doc.links) as EventLink[],
      landingPageIds: getArrayOrFallback(doc.landing_page_ids, doc.landing_page_id),
      registrationFormIds: getArrayOrFallback(doc.registration_form_ids, doc.registration_form_id),
      submissionFormIds: getArrayOrFallback(doc.submission_form_ids, doc.submission_form_id),
      evaluationFormIds: deserializeArray(doc.evaluation_form_ids),
      certificateTemplateIds: deserializeArray(doc.certificate_template_ids),
      committeeIds: deserializeArray(doc.committee_ids),
      banner: doc.banner ? (typeof doc.banner === 'string' ? JSON.parse(doc.banner) : doc.banner) : undefined,
      publishStatus: (doc.publish_status as 'Draft' | 'Published' | 'Closed') || 'Draft',
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting user events:', error);
    throw new Error(error.message || 'Failed to load events');
  }
};

/**
 * Update event publish status
 */
export const updateEventPublishStatus = async (
  eventId: string,
  publishStatus: 'Draft' | 'Published' | 'Closed'
): Promise<void> => {
  try {
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ 
        publish_status: publishStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating event publish status:', error);
    throw new Error(error.message || 'Failed to update publish status');
  }
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', eventId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting event:', error);
    throw new Error(error.message || 'Failed to delete event');
  }
};

