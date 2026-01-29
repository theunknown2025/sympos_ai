import { supabase, TABLES, STORAGE_BUCKETS } from '../supabase';
import { uploadBase64ImageToStorage } from './storageService';

const TABLE_NAME = TABLES.CERTIFICATES;

export interface Certificate {
  id: string;
  userId: string; // Organizer who generated it
  eventId: string;
  templateId: string;
  participantSubmissionId: string; // FormSubmission ID
  certificateImageUrl: string; // URL to the certificate image/PDF
  certificateUrl: string; // Public URL to view the certificate
  participantName: string;
  participantEmail?: string;
  createdAt: Date;
}

/**
 * Save a generated certificate
 */
export const saveCertificate = async (
  userId: string,
  eventId: string,
  templateId: string,
  participantSubmissionId: string,
  certificateImageData: string, // Base64 image data
  participantName: string,
  participantEmail?: string,
  certificateId?: string // Optional: provide a specific certificate ID
): Promise<Certificate> => {
  try {
    // Upload certificate image to storage
    // Use 'certificates' folder which maps to MEDIA bucket (more likely to exist)
    // This will fallback to GENERAL if MEDIA doesn't exist
    let certificateImageUrl: string;
    
    try {
      // Try MEDIA bucket first (via 'certificates' folder)
      certificateImageUrl = await uploadBase64ImageToStorage(
        userId,
        certificateImageData,
        'certificates', // Maps to MEDIA bucket
        `certificate-${Date.now()}.png`
      );
    } catch (bucketError: any) {
      // If MEDIA bucket doesn't exist, fallback to GENERAL bucket
      if (bucketError.message?.includes('Bucket not found') || bucketError.message?.includes('bucket')) {
        console.warn('MEDIA bucket not found, using GENERAL bucket as fallback');
        const imageBlob = await fetch(certificateImageData).then(r => r.blob());
        const file = new File([imageBlob], `certificate-${Date.now()}.png`, { type: 'image/png' });
        
        const fileExt = 'png';
        const fileName = `${userId}/certificates/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.GENERAL)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKETS.GENERAL)
          .getPublicUrl(uploadData.path);
        
        certificateImageUrl = urlData.publicUrl;
      } else {
        throw bucketError;
      }
    }
    
    // Generate a unique certificate ID (or use provided one)
    const finalCertificateId = certificateId || crypto.randomUUID();
    
    // Generate public certificate URL
    const certificateUrl = `${window.location.origin}/certificate/${finalCertificateId}`;
    
    // Create certificate record
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        id: finalCertificateId,
        user_id: userId,
        event_id: eventId,
        template_id: templateId,
        participant_submission_id: participantSubmissionId,
        certificate_image_url: certificateImageUrl,
        certificate_url: certificateUrl,
        participant_name: participantName,
        participant_email: participantEmail,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      eventId: data.event_id,
      templateId: data.template_id,
      participantSubmissionId: data.participant_submission_id,
      certificateImageUrl: data.certificate_image_url,
      certificateUrl: certificateUrl,
      participantName: data.participant_name,
      participantEmail: data.participant_email,
      createdAt: new Date(data.created_at),
    };
  } catch (error: any) {
    console.error('Error saving certificate:', error);
    throw new Error(error.message || 'Failed to save certificate');
  }
};

/**
 * Get a certificate by ID
 */
export const getCertificate = async (certificateId: string): Promise<Certificate | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', certificateId)
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
    
    return {
      id: data.id,
      userId: data.user_id,
      eventId: data.event_id,
      templateId: data.template_id,
      participantSubmissionId: data.participant_submission_id,
      certificateImageUrl: data.certificate_image_url,
      certificateUrl: data.certificate_url || `${window.location.origin}/certificate/${data.id}`,
      participantName: data.participant_name,
      participantEmail: data.participant_email,
      createdAt: new Date(data.created_at),
    };
  } catch (error: any) {
    console.error('Error getting certificate:', error);
    throw error;
  }
};
