import { supabase, TABLES } from '../supabase';
import { FormSubmission } from '../types';

export type { FormSubmission };

const TABLE_NAME = TABLES.FORM_SUBMISSIONS;

/**
 * Save a form submission
 */
export const saveFormSubmission = async (
  submission: Omit<FormSubmission, 'id' | 'submittedAt'>
): Promise<string> => {
  try {
    // Serialize JSON fields for Supabase storage
    const insertData: any = {
      form_id: submission.formId,
      event_id: submission.eventId,
      event_title: submission.eventTitle,
      user_id: submission.userId,
      submitted_by: submission.submittedBy,
    };
    if (submission.generalInfo !== undefined) {
      insertData.general_info = JSON.stringify(submission.generalInfo);
    }
    if (submission.answers !== undefined) {
      insertData.answers = JSON.stringify(submission.answers);
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
  } catch (error) {
    console.error('Error saving form submission:', error);
    throw error;
  }
};

/**
 * Get all submissions for a specific event
 */
export const getEventSubmissions = async (
  eventId: string
): Promise<FormSubmission[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    const submissions = data.map(doc => {
      // Deserialize JSON fields from Supabase storage
      const generalInfo = typeof doc.general_info === 'string' 
        ? JSON.parse(doc.general_info) 
        : (doc.general_info || {});
      const answers = typeof doc.answers === 'string' 
        ? JSON.parse(doc.answers) 
        : (doc.answers || {});
      
      return {
        id: doc.id,
        formId: doc.form_id,
        eventId: doc.event_id,
        eventTitle: doc.event_title,
        userId: doc.user_id,
        submittedBy: doc.submitted_by,
        generalInfo: generalInfo,
        answers: answers,
        submittedAt: new Date(doc.created_at),
      };
    });
    
    // Sort by submittedAt descending (already sorted by query, but ensure)
    return submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  } catch (error) {
    console.error('Error getting event submissions:', error);
    throw error;
  }
};

/**
 * Get all submissions for a user (all events they manage)
 */
export const getUserSubmissions = async (
  userId: string
): Promise<FormSubmission[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    const submissions = data.map(doc => {
      // Deserialize JSON fields from Supabase storage
      const generalInfo = typeof doc.general_info === 'string' 
        ? JSON.parse(doc.general_info) 
        : (doc.general_info || {});
      const answers = typeof doc.answers === 'string' 
        ? JSON.parse(doc.answers) 
        : (doc.answers || {});
      
      return {
        id: doc.id,
        formId: doc.form_id,
        eventId: doc.event_id,
        eventTitle: doc.event_title,
        userId: doc.user_id,
        submittedBy: doc.submitted_by,
        generalInfo: generalInfo,
        answers: answers,
        submittedAt: new Date(doc.created_at),
      };
    });
    
    // Sort by submittedAt descending
    return submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  } catch (error) {
    console.error('Error getting user submissions:', error);
    throw error;
  }
};

/**
 * Delete a form submission
 */
export const deleteFormSubmission = async (submissionId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', submissionId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting form submission:', error);
    throw new Error(error.message || 'Failed to delete form submission');
  }
};

/**
 * Delete multiple form submissions
 */
export const deleteFormSubmissions = async (submissionIds: string[]): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .in('id', submissionIds);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting form submissions:', error);
    throw new Error(error.message || 'Failed to delete form submissions');
  }
};
