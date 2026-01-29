import { supabase, TABLES } from '../supabase';
import { EvaluationAnswer } from '../types';

const TABLE_NAME = TABLES.EVALUATION_ANSWERS;

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
 * Save an evaluation answer
 */
export const saveEvaluationAnswer = async (
  answer: Omit<EvaluationAnswer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const cleanedAnswer = removeUndefined(answer);
    
    // Serialize JSON fields for Supabase storage
    const insertData: any = {
      evaluation_form_id: cleanedAnswer.evaluationFormId,
      user_id: cleanedAnswer.userId,
      submitted_by: cleanedAnswer.submittedBy || null,
    };
    if (cleanedAnswer.generalInfo !== undefined) {
      insertData.general_info = JSON.stringify(cleanedAnswer.generalInfo);
    }
    if (cleanedAnswer.answers !== undefined) {
      insertData.answers = JSON.stringify(cleanedAnswer.answers);
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
    console.error('Error saving evaluation answer:', error);
    throw error;
  }
};

/**
 * Get evaluation answers for a form
 */
export const getEvaluationAnswers = async (evaluationFormId: string): Promise<EvaluationAnswer[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('evaluation_form_id', evaluationFormId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    return data.map(doc => {
      // Deserialize JSON fields from Supabase storage
      const generalInfo = typeof doc.general_info === 'string' 
        ? JSON.parse(doc.general_info) 
        : (doc.general_info || undefined);
      const answers = typeof doc.answers === 'string' 
        ? JSON.parse(doc.answers) 
        : (doc.answers || {});
      
      return {
        id: doc.id,
        evaluationFormId: doc.evaluation_form_id,
        userId: doc.user_id,
        submittedBy: doc.submitted_by || undefined,
        generalInfo: generalInfo,
        answers: answers,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      };
    });
  } catch (error) {
    console.error('Error getting evaluation answers:', error);
    throw error;
  }
};

/**
 * Get evaluation answers for a user
 */
export const getUserEvaluationAnswers = async (userId: string): Promise<EvaluationAnswer[]> => {
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
    
    return data.map(doc => {
      // Deserialize JSON fields from Supabase storage
      const generalInfo = typeof doc.general_info === 'string' 
        ? JSON.parse(doc.general_info) 
        : (doc.general_info || undefined);
      const answers = typeof doc.answers === 'string' 
        ? JSON.parse(doc.answers) 
        : (doc.answers || {});
      
      return {
        id: doc.id,
        evaluationFormId: doc.evaluation_form_id,
        userId: doc.user_id,
        submittedBy: doc.submitted_by || undefined,
        generalInfo: generalInfo,
        answers: answers,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      };
    });
  } catch (error) {
    console.error('Error getting user evaluation answers:', error);
    throw error;
  }
};

/**
 * Get evaluation answers by user ID and form ID (for matching with reviews)
 */
export const getEvaluationAnswersByUserAndForm = async (
  userId: string,
  evaluationFormId: string
): Promise<EvaluationAnswer[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .eq('evaluation_form_id', evaluationFormId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    return data.map(doc => {
      // Deserialize JSON fields from Supabase storage
      const generalInfo = typeof doc.general_info === 'string' 
        ? JSON.parse(doc.general_info) 
        : (doc.general_info || undefined);
      const answers = typeof doc.answers === 'string' 
        ? JSON.parse(doc.answers) 
        : (doc.answers || {});
      
      return {
        id: doc.id,
        evaluationFormId: doc.evaluation_form_id,
        userId: doc.user_id,
        submittedBy: doc.submitted_by || undefined,
        generalInfo: generalInfo,
        answers: answers,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      };
    });
  } catch (error: any) {
    console.error('Error getting evaluation answers by user and form:', error);
    throw new Error(error.message || 'Failed to get evaluation answers');
  }
};

/**
 * Delete an evaluation answer
 */
export const deleteEvaluationAnswer = async (answerId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', answerId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting evaluation answer:', error);
    throw new Error(error.message || 'Failed to delete evaluation answer');
  }
};
