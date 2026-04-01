import { supabase, TABLES } from '../supabase';
import { Event, EventPartner, EventDate, EventLink } from '../types';

/**
 * Save an event for a participant
 */
export const saveEventForParticipant = async (
  userId: string,
  eventId: string
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANT_SAVED_EVENTS)
      .insert({
        user_id: userId,
        event_id: eventId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Already saved, return existing ID
        const { data: existing } = await supabase
          .from(TABLES.PARTICIPANT_SAVED_EVENTS)
          .select('id')
          .eq('user_id', userId)
          .eq('event_id', eventId)
          .single();
        return existing?.id || '';
      }
      throw error;
    }

    return data.id;
  } catch (error: any) {
    console.error('Error saving event for participant:', error);
    throw new Error(error.message || 'Failed to save event');
  }
};

/**
 * Remove a saved event for a participant
 */
export const removeSavedEvent = async (
  userId: string,
  eventId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLES.PARTICIPANT_SAVED_EVENTS)
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error removing saved event:', error);
    throw new Error(error.message || 'Failed to remove saved event');
  }
};

/**
 * Get all saved events for a participant
 */
export const getSavedEvents = async (userId: string): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANT_SAVED_EVENTS)
      .select(`
        event_id,
        events (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

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
      if (oldColumnValue) {
        return [oldColumnValue];
      }
      return [];
    };

    // Transform the data to extract events
    const events: Event[] = [];
    for (const item of data) {
      if (item.events) {
        const eventData = Array.isArray(item.events) ? item.events[0] : item.events;
        // Only include published events
        if (eventData.publish_status === 'Published' || eventData.publish_status === 'Closed') {
          events.push({
            id: eventData.id,
            userId: eventData.user_id,
            name: eventData.name,
            description: eventData.description || undefined,
            keywords: deserializeArray(eventData.keywords) as string[],
            fields: deserializeArray(eventData.fields) as string[],
            subfields: deserializeArray(eventData.subfields) as string[],
            eventType: eventData.event_type as 'Conference' | 'Seminar' | 'Workshop' | 'Webinar' | 'Continuing professional development event' | 'Online conference' | undefined,
            eventFormat: eventData.event_format as 'Virtual' | 'In-Person' | 'Hybrid' | undefined,
            partners: deserializeArray(eventData.partners) as EventPartner[],
            dates: deserializeArray(eventData.dates) as EventDate[],
            location: eventData.location || undefined,
            links: deserializeArray(eventData.links) as EventLink[],
            landingPageIds: getArrayOrFallback(eventData.landing_page_ids, eventData.landing_page_id),
            registrationFormIds: getArrayOrFallback(eventData.registration_form_ids, eventData.registration_form_id),
            submissionFormIds: getArrayOrFallback(eventData.submission_form_ids, eventData.submission_form_id),
            evaluationFormIds: deserializeArray(eventData.evaluation_form_ids),
            certificateTemplateIds: deserializeArray(eventData.certificate_template_ids),
            committeeIds: deserializeArray(eventData.committee_ids),
            banner: eventData.banner ? (typeof eventData.banner === 'string' ? JSON.parse(eventData.banner) : eventData.banner) : undefined,
            publishStatus: (eventData.publish_status as 'Draft' | 'Published' | 'Closed') || 'Draft',
            registrationDeadline: eventData.registration_deadline || undefined,
            submissionDeadline: eventData.submission_deadline || undefined,
            createdAt: new Date(eventData.created_at),
            updatedAt: new Date(eventData.updated_at),
          });
        }
      }
    }

    return events;
  } catch (error: any) {
    console.error('Error getting saved events:', error);
    throw new Error(error.message || 'Failed to get saved events');
  }
};

/**
 * Check if an event is saved by a participant
 */
export const isEventSaved = async (
  userId: string,
  eventId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANT_SAVED_EVENTS)
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error: any) {
    console.error('Error checking if event is saved:', error);
    return false;
  }
};

/**
 * Share an event with another user
 */
export const shareEvent = async (
  userId: string,
  eventId: string,
  sharedWithEmail: string,
  message?: string
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANT_SHARED_EVENTS)
      .insert({
        user_id: userId,
        event_id: eventId,
        shared_with_email: sharedWithEmail,
        message: message || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  } catch (error: any) {
    console.error('Error sharing event:', error);
    throw new Error(error.message || 'Failed to share event');
  }
};

/**
 * Get all events shared with a participant (by their email)
 */
export const getSharedEvents = async (userEmail: string): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANT_SHARED_EVENTS)
      .select(`
        event_id,
        events (*)
      `)
      .eq('shared_with_email', userEmail)
      .order('created_at', { ascending: false });

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
      if (oldColumnValue) {
        return [oldColumnValue];
      }
      return [];
    };

    // Transform the data to extract events
    const events: Event[] = [];
    for (const item of data) {
      if (item.events) {
        const eventData = Array.isArray(item.events) ? item.events[0] : item.events;
        // Only include published events
        if (eventData.publish_status === 'Published' || eventData.publish_status === 'Closed') {
          events.push({
            id: eventData.id,
            userId: eventData.user_id,
            name: eventData.name,
            description: eventData.description || undefined,
            keywords: deserializeArray(eventData.keywords) as string[],
            fields: deserializeArray(eventData.fields) as string[],
            subfields: deserializeArray(eventData.subfields) as string[],
            eventType: eventData.event_type as 'Conference' | 'Seminar' | 'Workshop' | 'Webinar' | 'Continuing professional development event' | 'Online conference' | undefined,
            eventFormat: eventData.event_format as 'Virtual' | 'In-Person' | 'Hybrid' | undefined,
            partners: deserializeArray(eventData.partners) as EventPartner[],
            dates: deserializeArray(eventData.dates) as EventDate[],
            location: eventData.location || undefined,
            links: deserializeArray(eventData.links) as EventLink[],
            landingPageIds: getArrayOrFallback(eventData.landing_page_ids, eventData.landing_page_id),
            registrationFormIds: getArrayOrFallback(eventData.registration_form_ids, eventData.registration_form_id),
            submissionFormIds: getArrayOrFallback(eventData.submission_form_ids, eventData.submission_form_id),
            evaluationFormIds: deserializeArray(eventData.evaluation_form_ids),
            certificateTemplateIds: deserializeArray(eventData.certificate_template_ids),
            committeeIds: deserializeArray(eventData.committee_ids),
            banner: eventData.banner ? (typeof eventData.banner === 'string' ? JSON.parse(eventData.banner) : eventData.banner) : undefined,
            publishStatus: (eventData.publish_status as 'Draft' | 'Published' | 'Closed') || 'Draft',
            registrationDeadline: eventData.registration_deadline || undefined,
            submissionDeadline: eventData.submission_deadline || undefined,
            createdAt: new Date(eventData.created_at),
            updatedAt: new Date(eventData.updated_at),
          });
        }
      }
    }

    return events;
  } catch (error: any) {
    console.error('Error getting shared events:', error);
    throw new Error(error.message || 'Failed to get shared events');
  }
};

/**
 * Get all events shared by a participant
 */
export const getEventsSharedByUser = async (userId: string): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANT_SHARED_EVENTS)
      .select(`
        event_id,
        events (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

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
      if (oldColumnValue) {
        return [oldColumnValue];
      }
      return [];
    };

    // Transform the data to extract events
    const events: Event[] = [];
    for (const item of data) {
      if (item.events) {
        const eventData = Array.isArray(item.events) ? item.events[0] : item.events;
        // Only include published events
        if (eventData.publish_status === 'Published' || eventData.publish_status === 'Closed') {
          events.push({
            id: eventData.id,
            userId: eventData.user_id,
            name: eventData.name,
            description: eventData.description || undefined,
            keywords: deserializeArray(eventData.keywords) as string[],
            fields: deserializeArray(eventData.fields) as string[],
            subfields: deserializeArray(eventData.subfields) as string[],
            eventType: eventData.event_type as 'Conference' | 'Seminar' | 'Workshop' | 'Webinar' | 'Continuing professional development event' | 'Online conference' | undefined,
            eventFormat: eventData.event_format as 'Virtual' | 'In-Person' | 'Hybrid' | undefined,
            partners: deserializeArray(eventData.partners) as EventPartner[],
            dates: deserializeArray(eventData.dates) as EventDate[],
            location: eventData.location || undefined,
            links: deserializeArray(eventData.links) as EventLink[],
            landingPageIds: getArrayOrFallback(eventData.landing_page_ids, eventData.landing_page_id),
            registrationFormIds: getArrayOrFallback(eventData.registration_form_ids, eventData.registration_form_id),
            submissionFormIds: getArrayOrFallback(eventData.submission_form_ids, eventData.submission_form_id),
            evaluationFormIds: deserializeArray(eventData.evaluation_form_ids),
            certificateTemplateIds: deserializeArray(eventData.certificate_template_ids),
            committeeIds: deserializeArray(eventData.committee_ids),
            banner: eventData.banner ? (typeof eventData.banner === 'string' ? JSON.parse(eventData.banner) : eventData.banner) : undefined,
            publishStatus: (eventData.publish_status as 'Draft' | 'Published' | 'Closed') || 'Draft',
            registrationDeadline: eventData.registration_deadline || undefined,
            submissionDeadline: eventData.submission_deadline || undefined,
            createdAt: new Date(eventData.created_at),
            updatedAt: new Date(eventData.updated_at),
          });
        }
      }
    }

    return events;
  } catch (error: any) {
    console.error('Error getting events shared by user:', error);
    throw new Error(error.message || 'Failed to get shared events');
  }
};
