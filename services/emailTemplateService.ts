import { supabase, TABLES, STORAGE_BUCKETS } from '../supabase';
import { EmailTemplate } from '../types';

const TABLE_NAME = TABLES.EMAIL_TEMPLATES;

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
 * Save a new email template
 */
export const saveEmailTemplate = async (
  userId: string,
  template: Omit<EmailTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!template.title || !template.title.trim()) {
      throw new Error('Template title is required');
    }
    
    if (!template.subject || !template.subject.trim()) {
      throw new Error('Email subject is required');
    }
    
    if (!template.body || !template.body.trim()) {
      throw new Error('Email body is required');
    }
    
    const cleanedTemplate = removeUndefined(template);
    
    const insertData: any = {
      user_id: userId,
      title: cleanedTemplate.title.trim(),
      subject: cleanedTemplate.subject.trim(),
      body: cleanedTemplate.body,
    };
    
    if (cleanedTemplate.placeholders !== undefined) {
      insertData.placeholders = JSON.stringify(cleanedTemplate.placeholders);
    }
    if (cleanedTemplate.attachments !== undefined) {
      insertData.attachments = JSON.stringify(cleanedTemplate.attachments);
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
    console.error('Error saving email template:', error);
    throw new Error(error.message || 'Failed to save email template');
  }
};

/**
 * Update an existing email template
 */
export const updateEmailTemplate = async (
  templateId: string,
  template: Partial<Omit<EmailTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    if (!templateId) {
      throw new Error('Template ID is required');
    }
    
    const cleanedTemplate = removeUndefined(template);
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (cleanedTemplate.title !== undefined) updateData.title = cleanedTemplate.title.trim();
    if (cleanedTemplate.subject !== undefined) updateData.subject = cleanedTemplate.subject.trim();
    if (cleanedTemplate.body !== undefined) updateData.body = cleanedTemplate.body;
    if (cleanedTemplate.placeholders !== undefined) {
      updateData.placeholders = JSON.stringify(cleanedTemplate.placeholders);
    }
    if (cleanedTemplate.attachments !== undefined) {
      updateData.attachments = JSON.stringify(cleanedTemplate.attachments);
    }
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', templateId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error updating email template:', error);
    throw new Error(error.message || 'Failed to update email template');
  }
};

/**
 * Get a single email template by ID
 */
export const getEmailTemplate = async (templateId: string): Promise<EmailTemplate | null> => {
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
    
    // Deserialize JSON fields
    const placeholders = typeof data.placeholders === 'string' 
      ? JSON.parse(data.placeholders) 
      : (data.placeholders || []);
    const attachments = typeof data.attachments === 'string' 
      ? JSON.parse(data.attachments) 
      : (data.attachments || []);
    
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      subject: data.subject,
      body: data.body,
      placeholders: placeholders.length > 0 ? placeholders : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting email template:', error);
    throw error;
  }
};

/**
 * Get all email templates for a user
 */
export const getUserEmailTemplates = async (userId: string): Promise<EmailTemplate[]> => {
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
      // Deserialize JSON fields
      const placeholders = typeof doc.placeholders === 'string' 
        ? JSON.parse(doc.placeholders) 
        : (doc.placeholders || []);
      const attachments = typeof doc.attachments === 'string' 
        ? JSON.parse(doc.attachments) 
        : (doc.attachments || []);
      
      return {
        id: doc.id,
        userId: doc.user_id,
        title: doc.title,
        subject: doc.subject,
        body: doc.body,
        placeholders: placeholders.length > 0 ? placeholders : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      };
    });
  } catch (error: any) {
    console.error('Error getting user email templates:', error);
    throw new Error(error.message || 'Failed to load email templates');
  }
};

/**
 * Delete an email template
 */
export const deleteEmailTemplate = async (templateId: string): Promise<void> => {
  try {
    if (!templateId) {
      throw new Error('Template ID is required');
    }
    
    // Get template to delete attachments
    const template = await getEmailTemplate(templateId);
    if (template && template.attachments && template.attachments.length > 0) {
      // Delete attachments from storage
      for (const attachmentPath of template.attachments) {
        try {
          // Extract file path from URL if it's a full URL
          let filePath = attachmentPath;
          if (attachmentPath.includes(STORAGE_BUCKETS.EMAIL_TEMPLATES)) {
            const urlMatch = attachmentPath.match(new RegExp(`${STORAGE_BUCKETS.EMAIL_TEMPLATES}/(.+)`));
            if (urlMatch && urlMatch[1]) {
              filePath = urlMatch[1].split('?')[0]; // Remove query params
            }
          }
          
          await supabase.storage
            .from(STORAGE_BUCKETS.EMAIL_TEMPLATES)
            .remove([filePath]);
        } catch (err) {
          console.error('Error deleting attachment:', err);
          // Continue even if attachment deletion fails
        }
      }
    }
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', templateId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting email template:', error);
    throw new Error(error.message || 'Failed to delete email template');
  }
};

/**
 * Upload an attachment file for an email template
 */
export const uploadEmailTemplateAttachment = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.EMAIL_TEMPLATES)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.EMAIL_TEMPLATES)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading email template attachment:', error);
    throw new Error(error.message || 'Failed to upload attachment');
  }
};

/**
 * Delete an attachment file
 */
export const deleteEmailTemplateAttachment = async (fileUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    let filePath = fileUrl;
    if (fileUrl.includes(STORAGE_BUCKETS.EMAIL_TEMPLATES)) {
      const urlMatch = fileUrl.match(new RegExp(`${STORAGE_BUCKETS.EMAIL_TEMPLATES}/(.+)`));
      if (urlMatch && urlMatch[1]) {
        filePath = urlMatch[1].split('?')[0]; // Remove query params
      }
    }
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.EMAIL_TEMPLATES)
      .remove([filePath]);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting email template attachment:', error);
    throw new Error(error.message || 'Failed to delete attachment');
  }
};

