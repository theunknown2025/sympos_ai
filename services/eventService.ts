import { supabase, TABLES } from '../supabase';
import { Event, EventPartner, EventDate, EventLink, SubscriptionRole } from '../types';

const TABLE_NAME = TABLES.EVENTS;

const getOrganizerCampusId = async (organizerUserId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from(TABLES.ORGANIZER_MEMBERSHIPS)
    .select('campus_id')
    .eq('organizer_user_id', organizerUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to fetch organizer campus');
  }

  return data?.campus_id ?? null;
};

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

    // Store campus_id for campus-scoped administration/subscription enforcement
    insertData.campus_id = await getOrganizerCampusId(userId);
    
    // Serialize array fields to JSON strings (new columns)
    insertData.keywords = JSON.stringify(cleanedEvent.keywords || []);
    insertData.fields = JSON.stringify(cleanedEvent.fields || []);
    insertData.subfields = JSON.stringify(cleanedEvent.subfields || []);
    insertData.event_type = cleanedEvent.eventType || null;
    insertData.event_format = cleanedEvent.eventFormat || null;
    insertData.partners = JSON.stringify(cleanedEvent.partners || []);
    insertData.dates = JSON.stringify(cleanedEvent.dates || []);
    insertData.links = JSON.stringify(cleanedEvent.links || []);
    insertData.landing_page_ids = JSON.stringify(cleanedEvent.landingPageIds || []);
    insertData.registration_form_ids = JSON.stringify(cleanedEvent.registrationFormIds || []);
    insertData.submission_form_ids = JSON.stringify(cleanedEvent.submissionFormIds || []);
    insertData.evaluation_form_ids = JSON.stringify(cleanedEvent.evaluationFormIds || []);
    insertData.certificate_template_ids = JSON.stringify(cleanedEvent.certificateTemplateIds || []);
    insertData.badge_template_ids = JSON.stringify(cleanedEvent.badgeTemplateIds || []);
    insertData.committee_ids = JSON.stringify(cleanedEvent.committeeIds || []);
    insertData.evaluation_enabled =
      cleanedEvent.evaluationEnabled === undefined ? false : Boolean(cleanedEvent.evaluationEnabled);
    insertData.banner = cleanedEvent.banner ? JSON.stringify(cleanedEvent.banner) : null;
    insertData.publish_status = cleanedEvent.publishStatus || 'Draft';
    insertData.registration_deadline = cleanedEvent.registrationDeadline || null;
    insertData.submission_deadline = cleanedEvent.submissionDeadline || null;
    insertData.submission_workflow_preset = cleanedEvent.submissionWorkflowPreset || null;
    insertData.abstract_submission_form_ids = JSON.stringify(cleanedEvent.abstractSubmissionFormIds || []);
    insertData.abstract_submission_deadline = cleanedEvent.abstractSubmissionDeadline || null;
    insertData.payment_deadline = cleanedEvent.paymentDeadline || null;
    insertData.registration_workflow_preset = cleanedEvent.registrationWorkflowPreset || null;
    insertData.registration_payment_offer_id = cleanedEvent.registrationPaymentOfferId || null;
    insertData.submission_payment_offer_id = cleanedEvent.submissionPaymentOfferId || null;

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

    // Keep campus_id aligned with the owning organizer's campus membership
    const { data: existingEvent, error: existingErr } = await supabase
      .from(TABLE_NAME)
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (existingErr) {
      throw existingErr;
    }

    updateData.campus_id = existingEvent?.user_id
      ? await getOrganizerCampusId(existingEvent.user_id)
      : null;
    
    if (cleanedEvent.name !== undefined) updateData.name = cleanedEvent.name.trim();
    if (cleanedEvent.description !== undefined) updateData.description = cleanedEvent.description;
    if (cleanedEvent.location !== undefined) updateData.location = cleanedEvent.location;
    if (cleanedEvent.keywords !== undefined) updateData.keywords = JSON.stringify(cleanedEvent.keywords);
    if (cleanedEvent.fields !== undefined) updateData.fields = JSON.stringify(cleanedEvent.fields);
    if (cleanedEvent.subfields !== undefined) updateData.subfields = JSON.stringify(cleanedEvent.subfields);
    if (cleanedEvent.eventType !== undefined) updateData.event_type = cleanedEvent.eventType || null;
    if (cleanedEvent.eventFormat !== undefined) updateData.event_format = cleanedEvent.eventFormat || null;
    if (cleanedEvent.partners !== undefined) updateData.partners = JSON.stringify(cleanedEvent.partners);
    if (cleanedEvent.dates !== undefined) updateData.dates = JSON.stringify(cleanedEvent.dates);
    if (cleanedEvent.links !== undefined) updateData.links = JSON.stringify(cleanedEvent.links);
    if (cleanedEvent.registrationDeadline !== undefined) updateData.registration_deadline = cleanedEvent.registrationDeadline || null;
    if (cleanedEvent.submissionDeadline !== undefined) updateData.submission_deadline = cleanedEvent.submissionDeadline || null;
    if (cleanedEvent.submissionWorkflowPreset !== undefined) {
      updateData.submission_workflow_preset = cleanedEvent.submissionWorkflowPreset || null;
    }
    if (cleanedEvent.abstractSubmissionFormIds !== undefined) {
      updateData.abstract_submission_form_ids = JSON.stringify(cleanedEvent.abstractSubmissionFormIds);
    }
    if (cleanedEvent.abstractSubmissionDeadline !== undefined) {
      updateData.abstract_submission_deadline =
        cleanedEvent.abstractSubmissionDeadline === '' || !cleanedEvent.abstractSubmissionDeadline
          ? null
          : cleanedEvent.abstractSubmissionDeadline;
    }
    if (cleanedEvent.paymentDeadline !== undefined) {
      updateData.payment_deadline =
        cleanedEvent.paymentDeadline === '' || !cleanedEvent.paymentDeadline
          ? null
          : cleanedEvent.paymentDeadline;
    }
    if (cleanedEvent.registrationWorkflowPreset !== undefined) {
      updateData.registration_workflow_preset = cleanedEvent.registrationWorkflowPreset || null;
    }
    if (cleanedEvent.registrationPaymentOfferId !== undefined) {
      updateData.registration_payment_offer_id =
        cleanedEvent.registrationPaymentOfferId === '' || !cleanedEvent.registrationPaymentOfferId
          ? null
          : cleanedEvent.registrationPaymentOfferId;
    }
    if (cleanedEvent.submissionPaymentOfferId !== undefined) {
      updateData.submission_payment_offer_id =
        cleanedEvent.submissionPaymentOfferId === '' || !cleanedEvent.submissionPaymentOfferId
          ? null
          : cleanedEvent.submissionPaymentOfferId;
    }
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
    if (cleanedEvent.badgeTemplateIds !== undefined) {
      updateData.badge_template_ids = JSON.stringify(cleanedEvent.badgeTemplateIds);
    }
    if (cleanedEvent.committeeIds !== undefined) {
      updateData.committee_ids = JSON.stringify(cleanedEvent.committeeIds);
    }
    if (cleanedEvent.evaluationEnabled !== undefined) {
      updateData.evaluation_enabled = Boolean(cleanedEvent.evaluationEnabled);
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
      campusId: data.campus_id || undefined,
      name: data.name,
      description: data.description,
      keywords: deserializeArray(data.keywords) as string[],
      fields: deserializeArray(data.fields) as string[],
      subfields: deserializeArray(data.subfields) as string[],
      eventType: data.event_type as 'Conference' | 'Seminar' | 'Workshop' | 'Webinar' | 'Continuing professional development event' | 'Online conference' | undefined,
      eventFormat: data.event_format as 'Virtual' | 'In-Person' | 'Hybrid' | undefined,
      partners: deserializeArray(data.partners) as EventPartner[],
      dates: deserializeArray(data.dates) as EventDate[],
      location: data.location || undefined,
      links: deserializeArray(data.links) as EventLink[],
      landingPageIds: getArrayOrFallback(data.landing_page_ids, data.landing_page_id),
      registrationFormIds: getArrayOrFallback(data.registration_form_ids, data.registration_form_id),
      submissionFormIds: getArrayOrFallback(data.submission_form_ids, data.submission_form_id),
      evaluationFormIds: deserializeArray(data.evaluation_form_ids),
      certificateTemplateIds: deserializeArray(data.certificate_template_ids),
      badgeTemplateIds: deserializeArray(data.badge_template_ids) as string[],
      committeeIds: deserializeArray(data.committee_ids),
      evaluationEnabled: Boolean(data.evaluation_enabled),
      banner: data.banner ? (typeof data.banner === 'string' ? JSON.parse(data.banner) : data.banner) : undefined,
      publishStatus: (data.publish_status as 'Draft' | 'Published' | 'Closed') || 'Draft',
      registrationDeadline: data.registration_deadline || undefined,
      submissionDeadline: data.submission_deadline || undefined,
      submissionWorkflowPreset: (data.submission_workflow_preset as 'A' | 'B' | 'C' | 'D') || undefined,
      abstractSubmissionFormIds: deserializeArray(data.abstract_submission_form_ids) as string[],
      abstractSubmissionDeadline: data.abstract_submission_deadline || undefined,
      paymentDeadline: data.payment_deadline || undefined,
      registrationWorkflowPreset: (data.registration_workflow_preset as 'A' | 'B') || undefined,
      registrationPaymentOfferId: data.registration_payment_offer_id || undefined,
      submissionPaymentOfferId: data.submission_payment_offer_id || undefined,
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
export const getUserEvents = async (userId: string, userRole?: SubscriptionRole | null): Promise<Event[]> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    let query = supabase
      .from(TABLE_NAME)
      .select('*');

    if (userRole === 'SuperAdmin') {
      // Root super admin can see all events; RLS handles the rest
    } else if (userRole === 'SubSuperAdmin') {
      const { data: sm, error: smErr } = await supabase
        .from(TABLES.SUB_SUPER_ADMIN_MEMBERSHIPS)
        .select('campus_id')
        .eq('user_id', userId);

      if (smErr) throw smErr;

      const campusIds = (sm || []).map((r) => r.campus_id).filter(Boolean);
      if (campusIds.length === 0) {
        return [];
      }

      query = query.in('campus_id', campusIds);
    } else {
      // Default organizer behavior
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });
    
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
      campusId: doc.campus_id || undefined,
      name: doc.name,
      description: doc.description,
      keywords: deserializeArray(doc.keywords) as string[],
      fields: deserializeArray(doc.fields) as string[],
      subfields: deserializeArray(doc.subfields) as string[],
      eventType: doc.event_type as 'Conference' | 'Seminar' | 'Workshop' | 'Webinar' | 'Continuing professional development event' | 'Online conference' | undefined,
      eventFormat: doc.event_format as 'Virtual' | 'In-Person' | 'Hybrid' | undefined,
      partners: deserializeArray(doc.partners) as EventPartner[],
      dates: deserializeArray(doc.dates) as EventDate[],
      location: doc.location || undefined,
      links: deserializeArray(doc.links) as EventLink[],
      landingPageIds: getArrayOrFallback(doc.landing_page_ids, doc.landing_page_id),
      registrationFormIds: getArrayOrFallback(doc.registration_form_ids, doc.registration_form_id),
      submissionFormIds: getArrayOrFallback(doc.submission_form_ids, doc.submission_form_id),
      evaluationFormIds: deserializeArray(doc.evaluation_form_ids),
      certificateTemplateIds: deserializeArray(doc.certificate_template_ids),
      badgeTemplateIds: deserializeArray(doc.badge_template_ids) as string[],
      committeeIds: deserializeArray(doc.committee_ids),
      evaluationEnabled: Boolean(doc.evaluation_enabled),
      banner: doc.banner ? (typeof doc.banner === 'string' ? JSON.parse(doc.banner) : doc.banner) : undefined,
      publishStatus: (doc.publish_status as 'Draft' | 'Published' | 'Closed') || 'Draft',
      registrationDeadline: doc.registration_deadline || undefined,
      submissionDeadline: doc.submission_deadline || undefined,
      submissionWorkflowPreset: (doc.submission_workflow_preset as 'A' | 'B' | 'C' | 'D') || undefined,
      abstractSubmissionFormIds: deserializeArray(doc.abstract_submission_form_ids) as string[],
      abstractSubmissionDeadline: doc.abstract_submission_deadline || undefined,
      paymentDeadline: doc.payment_deadline || undefined,
      registrationWorkflowPreset: (doc.registration_workflow_preset as 'A' | 'B') || undefined,
      registrationPaymentOfferId: doc.registration_payment_offer_id || undefined,
      submissionPaymentOfferId: doc.submission_payment_offer_id || undefined,
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting user events:', error);
    throw new Error(error.message || 'Failed to load events');
  }
};

/**
 * Lightweight events for dashboard: no banner, partners, dates, or large JSON blobs.
 */
export const getUserEventsForDashboard = async (
  userId: string,
  userRole?: SubscriptionRole | null
): Promise<Event[]> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    let query = supabase
      .from(TABLE_NAME)
      .select(
        'id, user_id, campus_id, name, publish_status, registration_deadline, event_type, event_format, committee_ids, created_at, updated_at'
      );

    if (userRole === 'SuperAdmin') {
      // Root super admin can see all events; RLS handles the rest
    } else if (userRole === 'SubSuperAdmin') {
      const { data: sm, error: smErr } = await supabase
        .from(TABLES.SUB_SUPER_ADMIN_MEMBERSHIPS)
        .select('campus_id')
        .eq('user_id', userId);

      if (smErr) throw smErr;

      const campusIds = (sm || []).map((r) => r.campus_id).filter(Boolean);
      if (campusIds.length === 0) {
        return [];
      }

      query = query.in('campus_id', campusIds);
    } else {
      // Default organizer behavior
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

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

    return data.map((doc) => ({
      id: doc.id,
      userId: doc.user_id,
      campusId: doc.campus_id || undefined,
      name: doc.name,
      description: undefined,
      keywords: [],
      fields: [],
      subfields: [],
      eventType: doc.event_type as Event['eventType'],
      eventFormat: doc.event_format as Event['eventFormat'],
      partners: [],
      dates: [],
      location: undefined,
      links: [],
      landingPageIds: [],
      registrationFormIds: [],
      submissionFormIds: [],
      evaluationFormIds: [],
      certificateTemplateIds: [],
      committeeIds: deserializeArray(doc.committee_ids),
      banner: undefined,
      publishStatus: (doc.publish_status as Event['publishStatus']) || 'Draft',
      registrationDeadline: doc.registration_deadline || undefined,
      submissionDeadline: undefined,
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting dashboard events:', error);
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

    // Service-level safety check:
    // - Organizer: can only update their own events
    // - Sub-super admin: can only update events in their managed campus(es)
    // - Root super admin: global access
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;

    const actorId = authData.user?.id;
    const actorRole = authData.user?.user_metadata?.role as SubscriptionRole | undefined;

    const { data: eventRow, error: eventErr } = await supabase
      .from(TABLE_NAME)
      .select('user_id, campus_id')
      .eq('id', eventId)
      .single();

    if (eventErr) throw eventErr;
    if (!eventRow) throw new Error('Event not found');

    let canUpdate = false;
    if (actorRole === 'SuperAdmin') {
      canUpdate = true;
    } else if (actorRole === 'Organizer') {
      canUpdate = actorId === eventRow.user_id;
    } else if (actorRole === 'SubSuperAdmin') {
      if (actorId && eventRow.campus_id) {
        const { data: smRow, error: smErr } = await supabase
          .from(TABLES.SUB_SUPER_ADMIN_MEMBERSHIPS)
          .select('id')
          .eq('user_id', actorId)
          .eq('campus_id', eventRow.campus_id)
          .maybeSingle();

        if (smErr) throw smErr;
        canUpdate = !!smRow;
      }
    } else {
      // Fallback: allow only if the actor owns the event
      canUpdate = actorId === eventRow.user_id;
    }

    if (!canUpdate) {
      throw new Error('Not authorized to update this event publish status');
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

