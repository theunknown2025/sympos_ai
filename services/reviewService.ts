import { supabase, TABLES } from '../supabase';
import { ParticipantReview } from '../types';

const TABLE_NAME = TABLES.PARTICIPANT_REVIEWS;

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
 * Save or update a participant review
 */
export const saveReview = async (
  review: Omit<ParticipantReview, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const cleanedReview = removeUndefined(review);
    
    // Serialize JSON fields for Supabase storage
    const insertData: any = {
      participant_id: cleanedReview.participantId,
      user_id: cleanedReview.userId,
      event_id: cleanedReview.eventId,
      form_id: cleanedReview.formId,
      submission_id: cleanedReview.submissionId,
      submission_type: cleanedReview.submissionType,
      status: cleanedReview.status || 'draft', // Default to 'draft' if not specified
    };
    
    if (cleanedReview.answers !== undefined) {
      insertData.answers = JSON.stringify(cleanedReview.answers);
    }
    
    // Debug: Log what we're checking for
    console.log(`[saveReview] Checking for existing review:`, {
      participant_id: cleanedReview.participantId,
      submission_id: cleanedReview.submissionId,
      form_id: cleanedReview.formId,
      submissionIdType: typeof cleanedReview.submissionId,
      formIdType: typeof cleanedReview.formId,
    });
    
    // Check if review already exists
    const { data: existing, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('participant_id', cleanedReview.participantId)
      .eq('submission_id', cleanedReview.submissionId)
      .eq('form_id', cleanedReview.formId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`[saveReview] Error checking for existing review:`, fetchError);
      throw fetchError;
    }
    
    console.log(`[saveReview] Existing review found:`, existing ? existing.id : 'none');
    
    if (existing) {
      // Update existing review
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
          answers: insertData.answers,
          status: insertData.status,
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
      // Create new review
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data.id;
    }
  } catch (error: any) {
    console.error('Error saving review:', error);
    throw new Error(error.message || 'Failed to save review');
  }
};

/**
 * Get a review by ID
 */
export const getReview = async (reviewId: string): Promise<ParticipantReview | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', reviewId)
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
    
    // Deserialize JSON fields
    const answers = typeof data.answers === 'string' 
      ? JSON.parse(data.answers) 
      : (data.answers || {});
    
    return {
      id: data.id,
      participantId: data.participant_id,
      userId: data.user_id,
      eventId: data.event_id,
      formId: data.form_id,
      submissionId: data.submission_id,
      submissionType: data.submission_type as 'submission' | 'evaluation',
      status: (data.status as 'draft' | 'completed') || 'draft',
      answers: answers,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting review:', error);
    throw new Error(error.message || 'Failed to get review');
  }
};

/**
 * Get review for a specific submission by participant
 */
export const getReviewForSubmission = async (
  participantId: string,
  submissionId: string,
  formId: string
): Promise<ParticipantReview | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('participant_id', participantId)
      .eq('submission_id', submissionId)
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
    
    // Deserialize JSON fields
    const answers = typeof data.answers === 'string' 
      ? JSON.parse(data.answers) 
      : (data.answers || {});
    
    return {
      id: data.id,
      participantId: data.participant_id,
      userId: data.user_id,
      eventId: data.event_id,
      formId: data.form_id,
      submissionId: data.submission_id,
      submissionType: data.submission_type as 'submission' | 'evaluation',
      status: (data.status as 'draft' | 'completed') || 'draft',
      answers: answers,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting review for submission:', error);
    throw new Error(error.message || 'Failed to get review');
  }
};

/**
 * Get all reviews for a participant
 */
export const getParticipantReviews = async (
  participantId: string
): Promise<ParticipantReview[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('participant_id', participantId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    return data.map(doc => {
      // Deserialize JSON fields
      const answers = typeof doc.answers === 'string' 
        ? JSON.parse(doc.answers) 
        : (doc.answers || {});
      
      return {
        id: doc.id,
        participantId: doc.participant_id,
        userId: doc.user_id,
        eventId: doc.event_id,
        formId: doc.form_id,
        submissionId: doc.submission_id,
        submissionType: doc.submission_type as 'submission' | 'evaluation',
        status: (doc.status as 'draft' | 'completed') || 'draft',
        answers: answers,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      };
    });
  } catch (error: any) {
    console.error('Error getting participant reviews:', error);
    throw new Error(error.message || 'Failed to get participant reviews');
  }
};

/**
 * Get all reviews for a specific submission
 */
export const getReviewsForSubmission = async (
  submissionId: string,
  formId?: string
): Promise<ParticipantReview[]> => {
  try {
    // Debug: Log query parameters
    console.log(`[getReviewsForSubmission] Querying with:`, {
      submissionId,
      formId,
      submissionIdType: typeof submissionId,
      formIdType: typeof formId,
    });
    
    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('submission_id', submissionId);
    
    if (formId) {
      query = query.eq('form_id', formId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    // Debug: Log query results
    if (error) {
      console.error(`[getReviewsForSubmission] Query error:`, error);
    } else {
      console.log(`[getReviewsForSubmission] Query returned ${data?.length || 0} reviews`);
      if (data && data.length > 0) {
        console.log(`[getReviewsForSubmission] Review IDs:`, data.map(r => ({
          id: r.id,
          submission_id: r.submission_id,
          form_id: r.form_id,
          status: r.status,
        })));
      }
    }
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    return data.map(doc => {
      // Deserialize JSON fields
      const answers = typeof doc.answers === 'string' 
        ? JSON.parse(doc.answers) 
        : (doc.answers || {});
      
      return {
        id: doc.id,
        participantId: doc.participant_id,
        userId: doc.user_id,
        eventId: doc.event_id,
        formId: doc.form_id,
        submissionId: doc.submission_id,
        submissionType: doc.submission_type as 'submission' | 'evaluation',
        status: (doc.status as 'draft' | 'completed') || 'draft',
        answers: answers,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      };
    });
  } catch (error: any) {
    console.error('Error getting reviews for submission:', error);
    throw new Error(error.message || 'Failed to get reviews for submission');
  }
};

/**
 * Get all reviews for an event
 */
export const getReviewsForEvent = async (
  eventId: string
): Promise<ParticipantReview[]> => {
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
    
    return data.map(doc => {
      // Deserialize JSON fields
      const answers = typeof doc.answers === 'string' 
        ? JSON.parse(doc.answers) 
        : (doc.answers || {});
      
      return {
        id: doc.id,
        participantId: doc.participant_id,
        userId: doc.user_id,
        eventId: doc.event_id,
        formId: doc.form_id,
        submissionId: doc.submission_id,
        submissionType: doc.submission_type as 'submission' | 'evaluation',
        status: (doc.status as 'draft' | 'completed') || 'draft',
        answers: answers,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      };
    });
  } catch (error: any) {
    console.error('Error getting reviews for event:', error);
    throw new Error(error.message || 'Failed to get reviews for event');
  }
};

/**
 * Delete a review
 */
export const deleteReview = async (reviewId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', reviewId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting review:', error);
    throw new Error(error.message || 'Failed to delete review');
  }
};
