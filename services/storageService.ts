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
    let bucketId: string;
    if (folder === 'certificate-templates') {
      bucketId = STORAGE_BUCKETS.CERTIFICATE_TEMPLATES;
    } else if (folder === 'badges') {
      bucketId = STORAGE_BUCKETS.BADGES;
    } else if (folder === 'landing-page-images') {
      bucketId = STORAGE_BUCKETS.MEDIA;
    } else if (folder === 'organizer-profiles') {
      bucketId = STORAGE_BUCKETS.ORGANIZER_PROFILES;
    } else if (folder === 'participant-profiles') {
      bucketId = STORAGE_BUCKETS.PARTICIPANT_PROFILES;
    } else if (folder === 'participant-badges' || folder === 'Participant_Badge') {
      bucketId = STORAGE_BUCKETS.PARTICIPANT_BADGE;
    } else {
      bucketId = STORAGE_BUCKETS.GENERAL;
    }
    
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
    let bucketId: string;
    if (folder === 'certificate-templates') {
      bucketId = STORAGE_BUCKETS.CERTIFICATE_TEMPLATES;
    } else if (folder === 'badges') {
      bucketId = STORAGE_BUCKETS.BADGES;
    } else if (folder === 'certificates') {
      // Use MEDIA bucket for generated certificates
      bucketId = STORAGE_BUCKETS.MEDIA;
    } else if (folder === 'participant-badges' || folder === 'Participant_Badge') {
      bucketId = STORAGE_BUCKETS.PARTICIPANT_BADGE;
    } else {
      bucketId = STORAGE_BUCKETS.GENERAL;
    }
    
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
 * @param folder The folder path in storage (e.g., 'form-submissions', 'sub-files')
 * @returns The download URL of the uploaded file
 */
export const uploadFileToStorage = async (
  userId: string,
  file: File,
  folder: string = 'form-submissions'
): Promise<string> => {
  try {
    // Determine bucket based on folder
    // Use Sub_Files for submission files (papers, documents from submission forms)
    const bucketId = folder === 'form-submissions' || folder === 'sub-files' || folder === 'submission-files'
      ? STORAGE_BUCKETS.SUB_FILES 
      : folder === 'certificate-templates'
      ? STORAGE_BUCKETS.CERTIFICATE_TEMPLATES
      : folder === 'badges'
      ? STORAGE_BUCKETS.BADGES
      : folder === 'email-attachments'
      ? STORAGE_BUCKETS.EMAIL_ATTACHMENTS
      : STORAGE_BUCKETS.GENERAL;
    
    // Debug: Log the bucket being used
    console.log('Uploading to bucket:', bucketId, 'for folder:', folder);
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    console.log('Upload details:', {
      bucket: bucketId,
      fileName: fileName,
      fileSize: file.size,
      fileType: file.type,
      userId: userId
    });
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketId)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Upload error details:', {
        error,
        statusCode: error.statusCode,
        message: error.message,
        bucket: bucketId,
        fileName: fileName
      });
      throw error;
    }
    
    if (!data) {
      console.error('Upload returned no data:', { bucketId, fileName });
      throw new Error('Upload failed: No data returned from storage');
    }
    
    console.log('Upload successful:', {
      path: data.path,
      id: data.id,
      bucket: bucketId
    });
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketId)
      .getPublicUrl(data.path);
    
    console.log('File URL generated:', urlData.publicUrl);
    
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
 * For private buckets, use signed URLs. For public buckets, use public URLs.
 * @param bucketId The bucket ID
 * @param filePath The file path (not just ID)
 * @param expiresIn Optional expiration time in seconds (default: 3600 for 1 hour)
 * @returns The download URL
 */
export const getFileDownloadURL = async (
  bucketId: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    // Check if bucket is public or private
    // For Sub_Files bucket (private), use signed URL
    if (bucketId === STORAGE_BUCKETS.SUB_FILES) {
      const { data, error } = await supabase.storage
        .from(bucketId)
        .createSignedUrl(filePath, expiresIn);
      
      if (error) {
        console.error('Error creating signed URL:', error);
        throw error;
      }
      
      return data.signedUrl;
    }
    
    // For public buckets, use public URL
    const { data } = supabase.storage
      .from(bucketId)
      .getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error: any) {
    console.error('Error getting file download URL:', error);
    throw new Error('Failed to get file URL. Please try again.');
  }
};

/**
 * Get file download URL synchronously (for public buckets only)
 * @param bucketId The bucket ID
 * @param filePath The file path
 * @returns The download URL
 */
export const getFileDownloadURLSync = (bucketId: string, filePath: string): string => {
  const { data } = supabase.storage
    .from(bucketId)
    .getPublicUrl(filePath);
  return data.publicUrl;
};
