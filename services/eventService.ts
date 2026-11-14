import { supabase, TABLES } from '../supabase';
import { Event, EventPartner, EventDate, EventLink, SubscriptionRole } from '../types';
import { mapEventTemplateFields, serializeEventTemplateFields } from './eventTemplateFields';
import {
  mapEventCheckinDisplayFields,
  serializeEventCheckinDisplayFields,
} from './eventCheckinDisplayFields';
import {
  getEventOrganizerPartners,
  isEventOrganizerPartner,
  setEventOrganizerPartners,
} from './eventPartnershipService';
import {
  assertOrganizerCanCreateEvent,
  EventQuotaExceededError,
  getOrganizerEventQuota,
  isEventQuotaDbError,
} from './organizerEventQuota';
import { assertEventResourcePayload, EventResourceSlotFullError } from './eventResources/slots';

const TABLE_NAME = TABLES.EVENTS;

const getPartneredEventIdsForUser = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.EVENT_ORGANIZER_PARTNERSHIPS)
      .select('event_id')
      .eq('partner_user_id', userId);

    if (error) {
      console.warn('Could not load event partnerships:', error.message);
      return [];
    }

    return (data || []).map((row) => row.event_id as string).filter(Boolean);
  } catch (err) {
    console.warn('Could not load event partnerships:', err);
    return [];
  }
};

/** Owned events plus events where the user is a co-organizer partner. */
const fetchOrganizerEventRows = async (
  userId: string,
  select: string
): Promise<Record<string, unknown>[]> => {
  const partneredEventIds = await getPartneredEventIdsForUser(userId);

  const ownedRes = await supabase
    .from(TABLE_NAME)
    .select(select)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (ownedRes.error) {
    throw ownedRes.error;
  }

  let partneredRows: Record<string, unknown>[] = [];
  if (partneredEventIds.length > 0) {
    const partneredRes = await supabase
      .from(TABLE_NAME)
      .select(select)
      .in('id', partneredEventIds)
      .order('updated_at', { ascending: false });

    if (partneredRes.error) {
      throw partneredRes.error;
    }
    partneredRows = (partneredRes.data || []) as Record<string, unknown>[];
  }

  const byId = new Map<string, Record<string, unknown>>();
  for (const row of [...(ownedRes.data || []), ...partneredRows] as Record<string, unknown>[]) {
    const id = row.id as string;
    if (id) byId.set(id, row);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aTime = new Date((a.updated_at as string) || 0).getTime();
    const bTime = new Date((b.updated_at as string) || 0).getTime();
    return bTime - aTime;
  });
};

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

    await assertOrganizerCanCreateEvent(userId);

    const cleanedEvent = removeUndefined(event);
    assertEventResourcePayload(cleanedEvent);
    
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
    Object.assign(
      insertData,
      serializeEventTemplateFields({
        registrationBadgeTemplateIds: cleanedEvent.registrationBadgeTemplateIds,
        registrationCertificateTemplateIds:
          cleanedEvent.registrationCertificateTemplateIds ?? cleanedEvent.certificateTemplateIds,
        submissionBadgeTemplateIds:
          cleanedEvent.submissionBadgeTemplateIds ?? cleanedEvent.badgeTemplateIds,
        submissionCertificateTemplateIds: cleanedEvent.submissionCertificateTemplateIds,
      })
    );
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
    insertData.submission_payment_form_id = cleanedEvent.submissionPaymentFormId || null;
    insertData.published_program_id = cleanedEvent.publishedProgramId || null;
    Object.assign(insertData, serializeEventCheckinDisplayFields(cleanedEvent));

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

    const newEventId = data.id as string;

    if (cleanedEvent.organizerPartnerUserIds?.length) {
      await setEventOrganizerPartners(newEventId, cleanedEvent.organizerPartnerUserIds, userId);
    }

    return newEventId;
  } catch (error: any) {
    if (error instanceof EventQuotaExceededError || error instanceof EventResourceSlotFullError) {
      throw error;
    }
    if (isEventQuotaDbError(error)) {
      const quota = await getOrganizerEventQuota(userId);
      throw new EventQuotaExceededError(quota);
    }
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
    assertEventResourcePayload(cleanedEvent);
    
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
    if (cleanedEvent.submissionPaymentFormId !== undefined) {
      updateData.submission_payment_form_id =
        cleanedEvent.submissionPaymentFormId === '' || !cleanedEvent.submissionPaymentFormId
          ? null
          : cleanedEvent.submissionPaymentFormId;
    }
    if (cleanedEvent.publishedProgramId !== undefined) {
      updateData.published_program_id =
        cleanedEvent.publishedProgramId === '' || !cleanedEvent.publishedProgramId
          ? null
          : cleanedEvent.publishedProgramId;
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
    if (
      cleanedEvent.registrationBadgeTemplateIds !== undefined ||
      cleanedEvent.registrationCertificateTemplateIds !== undefined ||
      cleanedEvent.submissionBadgeTemplateIds !== undefined ||
      cleanedEvent.submissionCertificateTemplateIds !== undefined ||
      cleanedEvent.certificateTemplateIds !== undefined ||
      cleanedEvent.badgeTemplateIds !== undefined
    ) {
      Object.assign(
        updateData,
        serializeEventTemplateFields({
          registrationBadgeTemplateIds: cleanedEvent.registrationBadgeTemplateIds,
          registrationCertificateTemplateIds:
            cleanedEvent.registrationCertificateTemplateIds ?? cleanedEvent.certificateTemplateIds,
          submissionBadgeTemplateIds:
            cleanedEvent.submissionBadgeTemplateIds ?? cleanedEvent.badgeTemplateIds,
          submissionCertificateTemplateIds: cleanedEvent.submissionCertificateTemplateIds,
        })
      );
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
    Object.assign(updateData, serializeEventCheckinDisplayFields(cleanedEvent));

    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', eventId);
    
    if (error) {
      throw error;
    }

    if (cleanedEvent.organizerPartnerUserIds !== undefined) {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const actorId = authData.user?.id;
      if (!actorId) {
        throw new Error('User not authenticated');
      }
      await setEventOrganizerPartners(eventId, cleanedEvent.organizerPartnerUserIds, actorId);
    }
  } catch (error: any) {
    if (error instanceof EventResourceSlotFullError) throw error;
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
    
    const organizerPartners = await getEventOrganizerPartners(data.id);

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
      organizerPartners,
      organizerPartnerUserIds: organizerPartners.map((p) => p.userId),
      dates: deserializeArray(data.dates) as EventDate[],
      location: data.location || undefined,
      links: deserializeArray(data.links) as EventLink[],
      landingPageIds: getArrayOrFallback(data.landing_page_ids, data.landing_page_id),
      registrationFormIds: getArrayOrFallback(data.registration_form_ids, data.registration_form_id),
      submissionFormIds: getArrayOrFallback(data.submission_form_ids, data.submission_form_id),
      evaluationFormIds: deserializeArray(data.evaluation_form_ids),
      ...mapEventTemplateFields(data),
      committeeIds: deserializeArray(data.committee_ids),
      evaluationEnabled: Boolean(data.evaluation_enabled),
      banner: data.banner ? (typeof data.banner === 'string' ? JSON.parse(data.banner) : data.banner) : undefined,
      publishStatus: (data.publish_status as 'Draft' | 'Published' | 'Closed') || 'Draft',
      publicSlug: (data.public_slug as string) || undefined,
      registrationDeadline: data.registration_deadline || undefined,
      submissionDeadline: data.submission_deadline || undefined,
      submissionWorkflowPreset: (data.submission_workflow_preset as 'A' | 'B' | 'C' | 'D') || undefined,
      abstractSubmissionFormIds: deserializeArray(data.abstract_submission_form_ids) as string[],
      abstractSubmissionDeadline: data.abstract_submission_deadline || undefined,
      paymentDeadline: data.payment_deadline || undefined,
      registrationWorkflowPreset: (data.registration_workflow_preset as 'A' | 'B') || undefined,
      registrationPaymentOfferId: data.registration_payment_offer_id || undefined,
      submissionPaymentOfferId: data.submission_payment_offer_id || undefined,
      submissionPaymentFormId: data.submission_payment_form_id || undefined,
      publishedProgramId: data.published_program_id || undefined,
      ...mapEventCheckinDisplayFields(data),
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

    let data: Record<string, unknown>[] | null = null;

    if (userRole === 'SuperAdmin') {
      const res = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('updated_at', { ascending: false });
      if (res.error) throw res.error;
      data = (res.data || []) as Record<string, unknown>[];
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

      const res = await supabase
        .from(TABLE_NAME)
        .select('*')
        .in('campus_id', campusIds)
        .order('updated_at', { ascending: false });

      if (res.error) throw res.error;
      data = (res.data || []) as Record<string, unknown>[];
    } else {
      data = await fetchOrganizerEventRows(userId, '*');
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
      ...mapEventTemplateFields(doc),
      committeeIds: deserializeArray(doc.committee_ids),
      evaluationEnabled: Boolean(doc.evaluation_enabled),
      banner: doc.banner ? (typeof doc.banner === 'string' ? JSON.parse(doc.banner) : doc.banner) : undefined,
      publishStatus: (doc.publish_status as 'Draft' | 'Published' | 'Closed') || 'Draft',
      publicSlug: (doc.public_slug as string) || undefined,
      registrationDeadline: doc.registration_deadline || undefined,
      submissionDeadline: doc.submission_deadline || undefined,
      submissionWorkflowPreset: (doc.submission_workflow_preset as 'A' | 'B' | 'C' | 'D') || undefined,
      abstractSubmissionFormIds: deserializeArray(doc.abstract_submission_form_ids) as string[],
      abstractSubmissionDeadline: doc.abstract_submission_deadline || undefined,
      paymentDeadline: doc.payment_deadline || undefined,
      registrationWorkflowPreset: (doc.registration_workflow_preset as 'A' | 'B') || undefined,
      registrationPaymentOfferId: doc.registration_payment_offer_id || undefined,
      submissionPaymentOfferId: doc.submission_payment_offer_id || undefined,
      submissionPaymentFormId: doc.submission_payment_form_id || undefined,
      publishedProgramId: doc.published_program_id || undefined,
      ...mapEventCheckinDisplayFields(doc),
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting user events:', error);
    throw new Error(error.message || 'Failed to load events');
  }
};

/**
 * Lightweight events for dashboard: includes banner for cards; no partners, dates, or large JSON blobs.
 */
export const getUserEventsForDashboard = async (
  userId: string,
  userRole?: SubscriptionRole | null
): Promise<Event[]> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    let data: Record<string, unknown>[] | null = null;
    const dashboardSelect =
      'id, user_id, campus_id, name, publish_status, registration_deadline, event_type, event_format, committee_ids, banner, created_at, updated_at';

    if (userRole === 'SuperAdmin') {
      const res = await supabase
        .from(TABLE_NAME)
        .select(dashboardSelect)
        .order('updated_at', { ascending: false });
      if (res.error) throw res.error;
      data = (res.data || []) as Record<string, unknown>[];
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

      const res = await supabase
        .from(TABLE_NAME)
        .select(dashboardSelect)
        .in('campus_id', campusIds)
        .order('updated_at', { ascending: false });

      if (res.error) throw res.error;
      data = (res.data || []) as Record<string, unknown>[];
    } else {
      data = await fetchOrganizerEventRows(userId, dashboardSelect);
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
      banner: doc.banner
        ? typeof doc.banner === 'string'
          ? JSON.parse(doc.banner)
          : doc.banner
        : undefined,
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
      canUpdate =
        actorId === eventRow.user_id ||
        (actorId ? await isEventOrganizerPartner(eventId, actorId) : false);
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
      canUpdate =
        actorId === eventRow.user_id ||
        (actorId ? await isEventOrganizerPartner(eventId, actorId) : false);
    }

    if (!canUpdate) {
      throw new Error('Not authorized to update this event publish status');
    }
    
    const patch: Record<string, unknown> = {
      publish_status: publishStatus,
      updated_at: new Date().toISOString(),
    };
    if (publishStatus === 'Draft') {
      patch.public_slug = null;
    } else if (publishStatus === 'Published') {
      const { data: evMeta, error: metaErr } = await supabase
        .from(TABLE_NAME)
        .select('name, public_slug')
        .eq('id', eventId)
        .single();
      if (metaErr) throw metaErr;
      if (!evMeta?.public_slug && evMeta?.name) {
        patch.public_slug = await ensureUniqueEventPublicSlug(
          slugifyEventName(evMeta.name as string),
          eventId
        );
      }
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .update(patch)
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

function mapEventDocument(doc: Record<string, unknown>): Event {
  const deserializeArray = (value: unknown): unknown[] => {
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

  const getArrayOrFallback = (newColumnValue: unknown, oldColumnValue: unknown): string[] => {
    const newArray = deserializeArray(newColumnValue);
    if (newArray.length > 0) {
      return newArray as string[];
    }
    if (oldColumnValue) {
      return [oldColumnValue as string];
    }
    return [];
  };

  return {
    id: doc.id as string,
    userId: doc.user_id as string,
    campusId: (doc.campus_id as string) || undefined,
    name: doc.name as string,
    description: (doc.description as string) || undefined,
    keywords: deserializeArray(doc.keywords) as string[],
    fields: deserializeArray(doc.fields) as string[],
    subfields: deserializeArray(doc.subfields) as string[],
    eventType: doc.event_type as Event['eventType'],
    eventFormat: doc.event_format as Event['eventFormat'],
    partners: deserializeArray(doc.partners) as EventPartner[],
    dates: deserializeArray(doc.dates) as EventDate[],
    location: (doc.location as string) || undefined,
    links: deserializeArray(doc.links) as EventLink[],
    landingPageIds: getArrayOrFallback(doc.landing_page_ids, doc.landing_page_id),
    registrationFormIds: getArrayOrFallback(doc.registration_form_ids, doc.registration_form_id),
    submissionFormIds: getArrayOrFallback(doc.submission_form_ids, doc.submission_form_id),
    evaluationFormIds: deserializeArray(doc.evaluation_form_ids) as string[],
    ...mapEventTemplateFields(doc),
    committeeIds: deserializeArray(doc.committee_ids) as string[],
    evaluationEnabled: Boolean(doc.evaluation_enabled),
    banner: doc.banner
      ? (typeof doc.banner === 'string' ? JSON.parse(doc.banner) : doc.banner)
      : undefined,
    publishStatus: (doc.publish_status as Event['publishStatus']) || 'Draft',
    publicSlug: (doc.public_slug as string) || undefined,
    registrationDeadline: (doc.registration_deadline as string) || undefined,
    submissionDeadline: (doc.submission_deadline as string) || undefined,
    submissionWorkflowPreset: doc.submission_workflow_preset as Event['submissionWorkflowPreset'],
    abstractSubmissionFormIds: deserializeArray(doc.abstract_submission_form_ids) as string[],
    abstractSubmissionDeadline: (doc.abstract_submission_deadline as string) || undefined,
    paymentDeadline: (doc.payment_deadline as string) || undefined,
    registrationWorkflowPreset: doc.registration_workflow_preset as Event['registrationWorkflowPreset'],
    registrationPaymentOfferId: (doc.registration_payment_offer_id as string) || undefined,
    submissionPaymentOfferId: (doc.submission_payment_offer_id as string) || undefined,
    submissionPaymentFormId: (doc.submission_payment_form_id as string) || undefined,
    publishedProgramId: (doc.published_program_id as string) || undefined,
    ...mapEventCheckinDisplayFields(doc),
    createdAt: new Date(doc.created_at as string),
    updatedAt: new Date(doc.updated_at as string),
  };
}

function slugifyEventName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'event';
}

async function ensureUniqueEventPublicSlug(
  baseSlug: string,
  excludeEventId?: string
): Promise<string> {
  let candidate = baseSlug;
  let suffix = 0;
  for (;;) {
    let query = supabase.from(TABLE_NAME).select('id').eq('public_slug', candidate);
    if (excludeEventId) {
      query = query.neq('id', excludeEventId);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message || 'Failed to validate public slug');
    if (!data) return candidate;
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

export function getEventPublicUrl(slug: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/e/${slug}`;
  }
  return `/e/${slug}`;
}

export function isEventRegistrationDeadlinePassed(event: Event): boolean {
  if (!event.registrationDeadline) return false;
  const end = new Date(event.registrationDeadline);
  end.setHours(23, 59, 59, 999);
  return Date.now() > end.getTime();
}

export function isEventSubmissionDeadlinePassed(event: Event): boolean {
  if (!event.submissionDeadline) return false;
  const end = new Date(event.submissionDeadline);
  end.setHours(23, 59, 59, 999);
  return Date.now() > end.getTime();
}

export const getPublishedEventBySlug = async (slug: string): Promise<Event | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('public_slug', slug)
    .eq('publish_status', 'Published')
    .maybeSingle();

  if (error) throw new Error(error.message || 'Failed to load event');
  if (!data) return null;

  return mapEventDocument(data as Record<string, unknown>);
};

/**
 * Find a published event that links the given landing page (via landing_page_id / landing_page_ids).
 */
export const getPublishedEventForLandingPage = async (
  landingPageId: string
): Promise<Event | null> => {
  if (!landingPageId) return null;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('publish_status', 'Published');

  if (error) throw new Error(error.message || 'Failed to load events');
  if (!data?.length) return null;

  for (const row of data) {
    const event = mapEventDocument(row as Record<string, unknown>);
    if (event.landingPageIds?.includes(landingPageId)) {
      return event;
    }
  }
  return null;
};

export const publishEventPublicly = async (
  eventId: string,
  userId: string
): Promise<{ slug: string; publicUrl: string }> => {
  const existing = await getEvent(eventId);
  if (!existing || existing.userId !== userId) {
    throw new Error('Event not found');
  }

  const slug =
    existing.publicSlug ||
    (await ensureUniqueEventPublicSlug(slugifyEventName(existing.name), eventId));

  const { error } = await supabase
    .from(TABLE_NAME)
    .update({
      publish_status: 'Published',
      public_slug: slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message || 'Failed to publish event');
  return { slug, publicUrl: getEventPublicUrl(slug) };
};

export interface PublishedEventSearchFilters {
  query?: string;
  eventType?: Event['eventType'];
  eventFormat?: Event['eventFormat'];
}

export interface PublishedEventSearchResult {
  events: Event[];
  total: number;
}

function publishedEventsBaseQuery() {
  return supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact' })
    .eq('publish_status', 'Published')
    .not('public_slug', 'is', null);
}

export const searchPublishedEvents = async (
  filters: PublishedEventSearchFilters,
  page = 1,
  pageSize = 15
): Promise<PublishedEventSearchResult> => {
  let query = publishedEventsBaseQuery();
  const term = filters.query?.trim().replace(/,/g, ' ');
  if (term) {
    const pattern = `%${term}%`;
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern},location.ilike.${pattern}`);
  }
  if (filters.eventType) query = query.eq('event_type', filters.eventType);
  if (filters.eventFormat) query = query.eq('event_format', filters.eventFormat);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message || 'Failed to search events');

  return {
    events: (data || []).map((row) => mapEventDocument(row as Record<string, unknown>)),
    total: count ?? 0,
  };
};

/**
 * Latest published events for marketing landing page.
 * Includes all Published events (public_slug optional; cards link to /e/{slug} when set).
 */
export const getLatestPublishedEvents = async (limit = 6): Promise<Event[]> => {
  const runQuery = () =>
    supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('publish_status', 'Published')
      .order('updated_at', { ascending: false })
      .limit(limit);

  let { data, error } = await runQuery();

  // Backward compat if migration not applied yet (no public_slug column).
  if (error?.message?.includes('public_slug')) {
    ({ data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('publish_status', 'Published')
      .order('updated_at', { ascending: false })
      .limit(limit));
  }

  if (error) {
    throw new Error(error.message || 'Failed to load published events');
  }

  return (data || []).map((doc) => mapEventDocument(doc as Record<string, unknown>));
};

