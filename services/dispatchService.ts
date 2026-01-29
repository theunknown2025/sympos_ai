import { supabase, TABLES } from '../supabase';
import { DispatchSubmission } from '../types';

const TABLE_NAME = TABLES.DISPATCH_SUBMISSIONS;

/**
 * Save or update a dispatch submission
 */
export const saveDispatchSubmission = async (
  userId: string,
  eventId: string,
  formId: string,
  dispatching: { [submissionId: string]: string[] },
  deadline?: Date
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    
    if (!formId) {
      throw new Error('Form ID is required');
    }
    
    // Check if a dispatch already exists for this event and form
    const { data: existing, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('form_id', formId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }
    
    const dispatchingJson = JSON.stringify(dispatching);
    
    const deadlineISO = deadline ? deadline.toISOString() : null;
    
    if (existing) {
      // Update existing dispatch
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
          dispatching: dispatchingJson,
          deadline: deadlineISO,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data.id;
    } else {
      // Create new dispatch
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert({
          user_id: userId,
          event_id: eventId,
          form_id: formId,
          dispatching: dispatchingJson,
          deadline: deadlineISO,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data.id;
    }
  } catch (error: any) {
    console.error('Error saving dispatch submission:', error);
    throw new Error(error.message || 'Failed to save dispatch submission');
  }
};

/**
 * Get dispatch submission for a specific event and form
 */
export const getDispatchSubmission = async (
  userId: string,
  eventId: string,
  formId: string
): Promise<DispatchSubmission | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('form_id', formId)
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
    
    // Deserialize dispatching JSON
    const dispatching = typeof data.dispatching === 'string' 
      ? JSON.parse(data.dispatching) 
      : (data.dispatching || {});
    
    return {
      id: data.id,
      userId: data.user_id,
      eventId: data.event_id,
      formId: data.form_id,
      dispatching,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting dispatch submission:', error);
    throw new Error(error.message || 'Failed to get dispatch submission');
  }
};

/**
 * Get all dispatch submissions for a user
 */
export const getUserDispatchSubmissions = async (
  userId: string
): Promise<DispatchSubmission[]> => {
  try {
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
      // Deserialize dispatching JSON
      const dispatching = typeof doc.dispatching === 'string' 
        ? JSON.parse(doc.dispatching) 
        : (doc.dispatching || {});
      
      return {
        id: doc.id,
        userId: doc.user_id,
        eventId: doc.event_id,
        formId: doc.form_id,
        dispatching,
        deadline: doc.deadline ? new Date(doc.deadline) : undefined,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      };
    });
  } catch (error: any) {
    console.error('Error getting user dispatch submissions:', error);
    throw new Error(error.message || 'Failed to get dispatch submissions');
  }
};

/**
 * Delete a dispatch submission
 */
export const deleteDispatchSubmission = async (dispatchId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', dispatchId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting dispatch submission:', error);
    throw new Error(error.message || 'Failed to delete dispatch submission');
  }
};

