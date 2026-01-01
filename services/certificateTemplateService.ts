import { supabase, TABLES } from '../supabase';
import { CertificateTemplate } from '../types';

const TABLE_NAME = TABLES.CERTIFICATE_TEMPLATES;

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
 * Save a new certificate template
 */
export const saveCertificateTemplate = async (
  userId: string,
  template: Omit<CertificateTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const cleanedTemplate = removeUndefined(template);
    
    // Serialize elements to JSON string for Supabase storage
    const insertData: any = {
      user_id: userId,
      title: cleanedTemplate.title,
      background_image: cleanedTemplate.backgroundImage,
      background_image_type: cleanedTemplate.backgroundImageType,
      width: cleanedTemplate.width,
      height: cleanedTemplate.height,
    };
    if (cleanedTemplate.elements !== undefined) {
      insertData.elements = JSON.stringify(cleanedTemplate.elements);
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
    console.error('Error saving certificate template:', error);
    throw error;
  }
};

/**
 * Update an existing certificate template
 */
export const updateCertificateTemplate = async (
  templateId: string,
  template: Partial<Omit<CertificateTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const cleanedTemplate = removeUndefined(template);
    
    // Serialize elements to JSON string for Supabase storage
    const updateData: any = {
      title: cleanedTemplate.title,
      background_image: cleanedTemplate.backgroundImage,
      background_image_type: cleanedTemplate.backgroundImageType,
      width: cleanedTemplate.width,
      height: cleanedTemplate.height,
      updated_at: new Date().toISOString(),
    };
    if (cleanedTemplate.elements !== undefined) {
      updateData.elements = JSON.stringify(cleanedTemplate.elements);
    }
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', templateId);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating certificate template:', error);
    throw error;
  }
};

/**
 * Get a single certificate template by ID
 */
export const getCertificateTemplate = async (templateId: string): Promise<CertificateTemplate | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', templateId)
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
    
    // Deserialize elements from JSON string
    const elements = typeof data.elements === 'string' 
      ? JSON.parse(data.elements) 
      : (data.elements || []);
    
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      backgroundImage: data.background_image,
      backgroundImageType: data.background_image_type,
      width: data.width,
      height: data.height,
      elements: elements,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting certificate template:', error);
    throw error;
  }
};

/**
 * Get all certificate templates for a user
 */
export const getUserCertificateTemplates = async (userId: string): Promise<CertificateTemplate[]> => {
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
      // Deserialize elements from JSON string
      const elements = typeof doc.elements === 'string' 
        ? JSON.parse(doc.elements) 
        : (doc.elements || []);
      
      return {
        id: doc.id,
        userId: doc.user_id,
        title: doc.title,
        backgroundImage: doc.background_image,
        backgroundImageType: doc.background_image_type,
        width: doc.width,
        height: doc.height,
        elements: elements,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      };
    });
  } catch (error) {
    console.error('Error getting user certificate templates:', error);
    throw error;
  }
};

/**
 * Delete a certificate template
 */
export const deleteCertificateTemplate = async (templateId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', templateId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting certificate template:', error);
    throw new Error(error.message || 'Failed to delete certificate template');
  }
};
