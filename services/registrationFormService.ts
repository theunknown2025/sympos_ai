import { supabase, TABLES } from '../supabase';
import { RegistrationForm } from '../types';

const TABLE_NAME = TABLES.REGISTRATION_FORMS;

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
 * Save a new registration form
 */
export const saveRegistrationForm = async (
  userId: string,
  form: Omit<RegistrationForm, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const cleanedForm = removeUndefined(form);
    
    // Serialize JSON fields for Supabase storage
    const insertData: any = {
      user_id: userId,
      title: cleanedForm.title,
      description: cleanedForm.description,
    };
    if (cleanedForm.sections !== undefined) {
      insertData.sections = JSON.stringify(cleanedForm.sections);
    }
    if (cleanedForm.fields !== undefined) {
      insertData.fields = JSON.stringify(cleanedForm.fields);
    }
    if (cleanedForm.generalInfo !== undefined) {
      insertData.general_info = JSON.stringify(cleanedForm.generalInfo);
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
    console.error('Error saving registration form:', error);
    throw error;
  }
};

/**
 * Update an existing registration form
 */
export const updateRegistrationForm = async (
  formId: string,
  form: Partial<Omit<RegistrationForm, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const cleanedForm = removeUndefined(form);
    
    // Serialize JSON fields for Supabase storage
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (cleanedForm.title !== undefined) updateData.title = cleanedForm.title;
    if (cleanedForm.description !== undefined) updateData.description = cleanedForm.description;
    if (cleanedForm.sections !== undefined) {
      updateData.sections = JSON.stringify(cleanedForm.sections);
    }
    if (cleanedForm.fields !== undefined) {
      updateData.fields = JSON.stringify(cleanedForm.fields);
    }
    if (cleanedForm.generalInfo !== undefined) {
      updateData.general_info = JSON.stringify(cleanedForm.generalInfo);
    }
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', formId);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating registration form:', error);
    throw error;
  }
};

/**
 * Get a single registration form by ID
 */
export const getRegistrationForm = async (formId: string): Promise<RegistrationForm | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', formId)
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
    
    // Deserialize JSON fields from Supabase storage
    const sections = typeof data.sections === 'string' 
      ? JSON.parse(data.sections) 
      : (data.sections || []);
    const fields = typeof data.fields === 'string' 
      ? JSON.parse(data.fields) 
      : (data.fields || []);
    const generalInfo = typeof data.general_info === 'string' 
      ? JSON.parse(data.general_info) 
      : (data.general_info || {
        collectName: true,
        collectEmail: true,
        collectPhone: false,
        collectOrganization: false,
        collectAddress: false,
      });
    
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      sections: sections,
      fields: fields,
      generalInfo: generalInfo,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting registration form:', error);
    throw error;
  }
};

/**
 * Get all registration forms for a user
 */
export const getUserRegistrationForms = async (userId: string): Promise<RegistrationForm[]> => {
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
      // Deserialize JSON fields from Supabase storage
      const sections = typeof doc.sections === 'string' 
        ? JSON.parse(doc.sections) 
        : (doc.sections || []);
      const fields = typeof doc.fields === 'string' 
        ? JSON.parse(doc.fields) 
        : (doc.fields || []);
      const generalInfo = typeof doc.general_info === 'string' 
        ? JSON.parse(doc.general_info) 
        : (doc.general_info || {
          collectName: true,
          collectEmail: true,
          collectPhone: false,
          collectOrganization: false,
          collectAddress: false,
        });
      
      return {
        id: doc.id,
        userId: doc.user_id,
        title: doc.title,
        description: doc.description,
        sections: sections,
        fields: fields,
        generalInfo: generalInfo,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      };
    });
  } catch (error) {
    console.error('Error getting user registration forms:', error);
    throw error;
  }
};

/**
 * Delete a registration form
 */
export const deleteRegistrationForm = async (formId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', formId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting registration form:', error);
    throw new Error(error.message || 'Failed to delete registration form');
  }
};
