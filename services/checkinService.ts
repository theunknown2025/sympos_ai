import { supabase, TABLES } from '../supabase';

export type CheckinStatus = 'undone' | 'done';

export interface RegistrationCheckin {
  id: string;
  userId: string;
  eventId: string;
  formSubmissionId: string;
  checkinStatus: CheckinStatus;
  checkedInAt?: Date;
  checkedInBy?: string;
  notes?: string;
  eventDayId?: string; // ID of the event day (null for collective check-in)
  eventDayLabel?: string; // Label for the event day (e.g., "Day 1", "2024-01-15")
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get check-in status for a form submission (for a specific day or collective)
 */
export const getCheckinForSubmission = async (
  formSubmissionId: string,
  eventDayId?: string | null
): Promise<RegistrationCheckin | null> => {
  try {
    let query = supabase
      .from(TABLES.REGISTRATION_CHECKIN)
      .select('*')
      .eq('form_submission_id', formSubmissionId);

    if (eventDayId === null || eventDayId === undefined) {
      // Get collective check-in (event_day_id is NULL)
      query = query.is('event_day_id', null);
    } else {
      // Get day-specific check-in
      query = query.eq('event_day_id', eventDayId);
    }

    const { data, error } = await query.single();

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
      eventId: data.event_id,
      formSubmissionId: data.form_submission_id,
      checkinStatus: data.checkin_status as CheckinStatus,
      checkedInAt: data.checked_in_at ? new Date(data.checked_in_at) : undefined,
      checkedInBy: data.checked_in_by || undefined,
      notes: data.notes || undefined,
      eventDayId: data.event_day_id || undefined,
      eventDayLabel: data.event_day_label || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting check-in for submission:', error);
    throw error;
  }
};

/**
 * Get all check-ins for a form submission (all days)
 */
export const getAllCheckinsForSubmission = async (
  formSubmissionId: string
): Promise<RegistrationCheckin[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.REGISTRATION_CHECKIN)
      .select('*')
      .eq('form_submission_id', formSubmissionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map(doc => ({
      id: doc.id,
      userId: doc.user_id,
      eventId: doc.event_id,
      formSubmissionId: doc.form_submission_id,
      checkinStatus: doc.checkin_status as CheckinStatus,
      checkedInAt: doc.checked_in_at ? new Date(doc.checked_in_at) : undefined,
      checkedInBy: doc.checked_in_by || undefined,
      notes: doc.notes || undefined,
      eventDayId: doc.event_day_id || undefined,
      eventDayLabel: doc.event_day_label || undefined,
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting all check-ins for submission:', error);
    throw error;
  }
};

/**
 * Get all check-ins for an event
 */
export const getCheckinsForEvent = async (
  eventId: string
): Promise<RegistrationCheckin[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.REGISTRATION_CHECKIN)
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map(doc => ({
      id: doc.id,
      userId: doc.user_id,
      eventId: doc.event_id,
      formSubmissionId: doc.form_submission_id,
      checkinStatus: doc.checkin_status as CheckinStatus,
      checkedInAt: doc.checked_in_at ? new Date(doc.checked_in_at) : undefined,
      checkedInBy: doc.checked_in_by || undefined,
      notes: doc.notes || undefined,
      eventDayId: doc.event_day_id || undefined,
      eventDayLabel: doc.event_day_label || undefined,
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting check-ins for event:', error);
    throw error;
  }
};

/**
 * Get check-in status map for multiple submissions
 * Returns a map where key is form_submission_id and value is an array of check-ins (one per day + collective)
 */
export const getCheckinStatusMap = async (
  formSubmissionIds: string[]
): Promise<Map<string, RegistrationCheckin[]>> => {
  try {
    if (formSubmissionIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabase
      .from(TABLES.REGISTRATION_CHECKIN)
      .select('*')
      .in('form_submission_id', formSubmissionIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const checkinMap = new Map<string, RegistrationCheckin[]>();
    
    if (data) {
      data.forEach(doc => {
        const checkin: RegistrationCheckin = {
          id: doc.id,
          userId: doc.user_id,
          eventId: doc.event_id,
          formSubmissionId: doc.form_submission_id,
          checkinStatus: doc.checkin_status as CheckinStatus,
          checkedInAt: doc.checked_in_at ? new Date(doc.checked_in_at) : undefined,
          checkedInBy: doc.checked_in_by || undefined,
          notes: doc.notes || undefined,
          eventDayId: doc.event_day_id || undefined,
          eventDayLabel: doc.event_day_label || undefined,
          createdAt: new Date(doc.created_at),
          updatedAt: new Date(doc.updated_at),
        };

        const existing = checkinMap.get(doc.form_submission_id) || [];
        checkinMap.set(doc.form_submission_id, [...existing, checkin]);
      });
    }

    return checkinMap;
  } catch (error: any) {
    console.error('Error getting check-in status map:', error);
    throw error;
  }
};

/**
 * Toggle check-in status for a registration (for a specific day or collective)
 */
export const toggleCheckin = async (
  userId: string,
  eventId: string,
  formSubmissionId: string,
  checkedInBy: string,
  eventDayId?: string | null,
  eventDayLabel?: string
): Promise<RegistrationCheckin> => {
  try {
    // Check if check-in record exists for this day/collective
    const existingCheckin = await getCheckinForSubmission(formSubmissionId, eventDayId);

    if (existingCheckin) {
      // Toggle status
      const newStatus: CheckinStatus = existingCheckin.checkinStatus === 'done' ? 'undone' : 'done';
      const updateData: any = {
        checkin_status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'done') {
        updateData.checked_in_at = new Date().toISOString();
        updateData.checked_in_by = checkedInBy;
      } else {
        updateData.checked_in_at = null;
        updateData.checked_in_by = null;
      }

      const { data, error } = await supabase
        .from(TABLES.REGISTRATION_CHECKIN)
        .update(updateData)
        .eq('id', existingCheckin.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        eventId: data.event_id,
        formSubmissionId: data.form_submission_id,
        checkinStatus: data.checkin_status as CheckinStatus,
        checkedInAt: data.checked_in_at ? new Date(data.checked_in_at) : undefined,
        checkedInBy: data.checked_in_by || undefined,
        notes: data.notes || undefined,
        eventDayId: data.event_day_id || undefined,
        eventDayLabel: data.event_day_label || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } else {
      // Create new check-in record with status 'done'
      const insertData: any = {
        user_id: userId,
        event_id: eventId,
        form_submission_id: formSubmissionId,
        checkin_status: 'done',
        checked_in_at: new Date().toISOString(),
        checked_in_by: checkedInBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (eventDayId !== undefined && eventDayId !== null) {
        insertData.event_day_id = eventDayId;
        insertData.event_day_label = eventDayLabel || eventDayId;
      } else {
        insertData.event_day_id = null;
        insertData.event_day_label = 'All Days';
      }

      const { data, error } = await supabase
        .from(TABLES.REGISTRATION_CHECKIN)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        eventId: data.event_id,
        formSubmissionId: data.form_submission_id,
        checkinStatus: data.checkin_status as CheckinStatus,
        checkedInAt: data.checked_in_at ? new Date(data.checked_in_at) : undefined,
        checkedInBy: data.checked_in_by || undefined,
        notes: data.notes || undefined,
        eventDayId: data.event_day_id || undefined,
        eventDayLabel: data.event_day_label || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    }
  } catch (error: any) {
    console.error('Error toggling check-in:', error);
    throw new Error(error.message || 'Failed to toggle check-in status');
  }
};

/**
 * Bulk toggle check-in for multiple registrations
 */
export const bulkToggleCheckin = async (
  userId: string,
  eventId: string,
  formSubmissionIds: string[],
  checkedInBy: string,
  eventDayId?: string | null,
  eventDayLabel?: string
): Promise<RegistrationCheckin[]> => {
  try {
    const results: RegistrationCheckin[] = [];

    for (const formSubmissionId of formSubmissionIds) {
      try {
        const checkin = await toggleCheckin(
          userId,
          eventId,
          formSubmissionId,
          checkedInBy,
          eventDayId,
          eventDayLabel
        );
        results.push(checkin);
      } catch (err: any) {
        console.error(`Error checking in submission ${formSubmissionId}:`, err);
        // Continue with other submissions
      }
    }

    return results;
  } catch (error: any) {
    console.error('Error in bulk toggle check-in:', error);
    throw new Error(error.message || 'Failed to bulk toggle check-in');
  }
};

/**
 * Set check-in status explicitly
 */
export const setCheckinStatus = async (
  userId: string,
  eventId: string,
  formSubmissionId: string,
  status: CheckinStatus,
  checkedInBy: string,
  notes?: string,
  eventDayId?: string | null,
  eventDayLabel?: string
): Promise<RegistrationCheckin> => {
  try {
    const existingCheckin = await getCheckinForSubmission(formSubmissionId, eventDayId);

    const checkinData: any = {
      user_id: userId,
      event_id: eventId,
      form_submission_id: formSubmissionId,
      checkin_status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'done') {
      checkinData.checked_in_at = new Date().toISOString();
      checkinData.checked_in_by = checkedInBy;
    } else {
      checkinData.checked_in_at = null;
      checkinData.checked_in_by = null;
    }

    if (notes !== undefined) {
      checkinData.notes = notes || null;
    }

    if (eventDayId !== undefined && eventDayId !== null) {
      checkinData.event_day_id = eventDayId;
      checkinData.event_day_label = eventDayLabel || eventDayId;
    } else {
      checkinData.event_day_id = null;
      checkinData.event_day_label = 'All Days';
    }

    if (existingCheckin) {
      // Update existing
      const { data, error } = await supabase
        .from(TABLES.REGISTRATION_CHECKIN)
        .update(checkinData)
        .eq('id', existingCheckin.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        eventId: data.event_id,
        formSubmissionId: data.form_submission_id,
        checkinStatus: data.checkin_status as CheckinStatus,
        checkedInAt: data.checked_in_at ? new Date(data.checked_in_at) : undefined,
        checkedInBy: data.checked_in_by || undefined,
        notes: data.notes || undefined,
        eventDayId: data.event_day_id || undefined,
        eventDayLabel: data.event_day_label || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } else {
      // Create new
      checkinData.created_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from(TABLES.REGISTRATION_CHECKIN)
        .insert(checkinData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        eventId: data.event_id,
        formSubmissionId: data.form_submission_id,
        checkinStatus: data.checkin_status as CheckinStatus,
        checkedInAt: data.checked_in_at ? new Date(data.checked_in_at) : undefined,
        checkedInBy: data.checked_in_by || undefined,
        notes: data.notes || undefined,
        eventDayId: data.event_day_id || undefined,
        eventDayLabel: data.event_day_label || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    }
  } catch (error: any) {
    console.error('Error setting check-in status:', error);
    throw new Error(error.message || 'Failed to set check-in status');
  }
};
