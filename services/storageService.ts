import { supabase, STORAGE_BUCKETS } from '../supabase';

/**
 * Upload an image file to Supabase Storage
 * @param userId The current user ID
 * @param file The image file to upload
 * @param folder The folder path in storage (e.g., 'certificate-templates')
 * @returns The download URL of the uploaded image
 */
export const uploadImageToStorage = async (
  userId: string,
  file: File,
  folder: string = 'certificate-templates'
): Promise<string> => {
  try {
    // Determine bucket based on folder
    const bucketId = folder === 'certificate-templates' 
      ? STORAGE_BUCKETS.CERTIFICATE_TEMPLATES 
      : STORAGE_BUCKETS.GENERAL;
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketId)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketId)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

/**
 * Upload a base64 image to Supabase Storage
 * @param userId The current user ID
 * @param base64Data The base64 image data (data URL)
 * @param folder The folder path in storage
 * @param filename Optional filename (defaults to timestamp)
 * @returns The download URL of the uploaded image
 */
export const uploadBase64ImageToStorage = async (
  userId: string,
  base64Data: string,
  folder: string = 'certificate-templates',
  filename?: string
): Promise<string> => {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    // Determine bucket based on folder
    const bucketId = folder === 'certificate-templates' 
      ? STORAGE_BUCKETS.CERTIFICATE_TEMPLATES 
      : STORAGE_BUCKETS.GENERAL;
    
    // Create a unique filename
    const timestamp = Date.now();
    const fileExtension = base64Data.includes('image/png') ? 'png' : 
                         base64Data.includes('image/jpeg') || base64Data.includes('image/jpg') ? 'jpg' : 
                         'png';
    const finalFilename = filename || `${timestamp}.${fileExtension}`;
    
    // Convert blob to File
    const file = new File([blob], finalFilename, { type: blob.type });
    
    // Generate unique filename
    const fileExt = finalFilename.split('.').pop() || 'png';
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Upload the file to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketId)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading base64 image to storage:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

/**
 * Upload any file to Supabase Storage
 * @param userId The current user ID
 * @param file The file to upload
 * @param folder The folder path in storage (e.g., 'form-submissions')
 * @returns The download URL of the uploaded file
 */
export const uploadFileToStorage = async (
  userId: string,
  file: File,
  folder: string = 'form-submissions'
): Promise<string> => {
  try {
    // Determine bucket based on folder
    const bucketId = folder === 'form-submissions' 
      ? STORAGE_BUCKETS.FORM_SUBMISSIONS 
      : STORAGE_BUCKETS.GENERAL;
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketId)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketId)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading file to storage:', error);
    
    // Check for permission errors
    if (error?.code === 401 || error?.code === 403) {
      throw new Error('Permission denied. Please check Supabase Storage permissions.');
    }
    
    // Check for bucket not found errors
    if (error?.code === 404 || error?.message?.includes('bucket') && error?.message?.includes('not found')) {
      throw new Error(
        'Storage bucket not found!\n\n' +
        'Please verify the bucket exists in your Supabase project:\n' +
        `1. Go to your Supabase Dashboard\n` +
        `2. Navigate to Storage\n` +
        `3. Make sure the bucket "${bucketId}" exists\n` +
        `4. Check that you have access to the bucket`
      );
    }
    
    // Generic error
    throw new Error(error?.message || 'Failed to upload file. Please try again.');
  }
};

/**
 * Delete an image from Supabase Storage
 * @param fileId The file ID to delete
 * @param bucketId The bucket ID where the file is stored
 */
export const deleteImageFromStorage = async (
  fileId: string,
  bucketId: string
): Promise<void> => {
  try {
    await mcpStorageService.delete(bucketId, fileId);
  } catch (error) {
    console.error('Error deleting image from storage:', error);
    // Don't throw - deletion is not critical
  }
};

/**
 * Get file download URL from Supabase Storage
 * @param bucketId The bucket ID
 * @param fileId The file ID
 * @returns The download URL
 */
export const getFileDownloadURL = (bucketId: string, fileId: string): string => {
  const { data } = supabase.storage
    .from(bucketId)
    .getPublicUrl(fileId);
  return data.publicUrl;
};
