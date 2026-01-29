import { supabase, TABLES, STORAGE_BUCKETS } from '../supabase';
import { CertificateTemplate, FormSubmission } from '../types';
import { getBadgeTemplate } from './badgeTemplateService';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

export interface ParticipantBadge {
  id: string;
  userId: string;
  eventId: string;
  formSubmissionId: string;
  badgeTemplateId: string;
  badgeImageUrl: string;
  participantName: string;
  participantEmail?: string;
  participantPhone?: string;
  participantOrganization?: string;
  registrationType: 'internal' | 'external';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get field value from submission
 */
const getFieldValue = (submission: FormSubmission, fieldName: string): string => {
  // Check general info first
  if (fieldName === 'name' || fieldName === 'general_name') {
    return submission.generalInfo?.name || submission.answers['general_name'] as string || '';
  }
  if (fieldName === 'email' || fieldName === 'general_email') {
    return submission.generalInfo?.email || submission.answers['general_email'] as string || '';
  }
  if (fieldName === 'phone' || fieldName === 'general_phone') {
    return submission.generalInfo?.phone || submission.answers['general_phone'] as string || '';
  }
  if (fieldName === 'organization' || fieldName === 'general_organization') {
    return submission.generalInfo?.organization || submission.answers['general_organization'] as string || '';
  }
  
  // Check answers
  const value = submission.answers[fieldName];
  if (value === null || value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
};

/**
 * Generate QR code data URL
 */
const generateQRCodeDataURL = async (url: string, size: number): Promise<string> => {
  try {
    return await QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Generate badge image from template and submission data
 */
export const generateBadgeImage = async (
  template: CertificateTemplate,
  submission: FormSubmission,
  badgeUrl?: string
): Promise<string> => {
  // Create a temporary container for the badge
  const container = document.createElement('div');
  container.style.width = `${template.width}px`;
  container.style.height = `${template.height}px`;
  container.style.position = 'relative';
  container.style.backgroundColor = '#ffffff';
  container.style.overflow = 'hidden';
  
  // Handle background image - use img element for better CORS handling
  if (template.backgroundImage) {
    const bgImg = document.createElement('img');
    bgImg.src = template.backgroundImage;
    bgImg.style.position = 'absolute';
    bgImg.style.top = '0';
    bgImg.style.left = '0';
    bgImg.style.width = '100%';
    bgImg.style.height = '100%';
    bgImg.style.objectFit = 'cover';
    bgImg.crossOrigin = 'anonymous';
    container.appendChild(bgImg);
    
    // Wait for image to load if it's a URL (not base64)
    if (!template.backgroundImage.startsWith('data:')) {
      await new Promise((resolve, reject) => {
        bgImg.onload = resolve;
        bgImg.onerror = () => {
          // If image fails to load, continue without it
          console.warn('Background image failed to load, continuing without it');
          resolve(null);
        };
        // Set a timeout to prevent hanging
        setTimeout(() => resolve(null), 5000);
      });
    }
  }
  
  // Add all elements to the container
  for (const element of template.elements) {
    const elementDiv = document.createElement('div');
    elementDiv.style.position = 'absolute';
    elementDiv.style.left = `${element.x}%`;
    elementDiv.style.top = `${element.y}%`;
    elementDiv.style.transform = 'translate(-50%, -50%)';
    elementDiv.style.zIndex = '10';
    
    if (element.type === 'qr') {
      // Generate QR code for this element
      if (badgeUrl) {
        try {
          const qrSize = element.fontSize;
          const qrDataUrl = await generateQRCodeDataURL(badgeUrl, qrSize);
          
          const qrImg = document.createElement('img');
          qrImg.src = qrDataUrl;
          qrImg.style.width = `${qrSize}px`;
          qrImg.style.height = `${qrSize}px`;
          qrImg.style.display = 'block';
          elementDiv.appendChild(qrImg);
        } catch (error) {
          console.error('Error generating QR code:', error);
          // Fallback: show placeholder
          elementDiv.style.width = `${element.fontSize}px`;
          elementDiv.style.height = `${element.fontSize}px`;
          elementDiv.style.backgroundColor = '#f3f4f6';
          elementDiv.style.border = '2px dashed #9ca3af';
          elementDiv.textContent = 'QR';
        }
      } else {
        // No badge URL yet, show placeholder
        elementDiv.style.width = `${element.fontSize}px`;
        elementDiv.style.height = `${element.fontSize}px`;
        elementDiv.style.backgroundColor = '#f3f4f6';
        elementDiv.style.border = '2px dashed #9ca3af';
        elementDiv.textContent = 'QR';
      }
    } else {
      // Text or field element
      elementDiv.style.fontSize = `${element.fontSize}px`;
      elementDiv.style.fontFamily = element.fontFamily;
      elementDiv.style.fontWeight = element.fontWeight;
      elementDiv.style.color = element.color;
      elementDiv.style.textAlign = element.textAlign;
      elementDiv.style.whiteSpace = 'nowrap';
      
      let content = element.content;
      if (element.type === 'field') {
        content = getFieldValue(submission, element.content);
      }
      
      elementDiv.textContent = content;
    }
    
    container.appendChild(elementDiv);
  }

  // Append to body temporarily (off-screen)
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  // Wait a bit for rendering
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    // Convert to canvas using html2canvas
    const canvas = await html2canvas(container, {
      width: template.width,
      height: template.height,
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: false, // Don't allow tainted canvas
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Convert canvas to data URL
    const imageData = canvas.toDataURL('image/png', 1.0);
    
    // Clean up
    document.body.removeChild(container);
    
    return imageData;
  } catch (error) {
    document.body.removeChild(container);
    console.error('Error generating badge:', error);
    throw new Error('Failed to generate badge. Please ensure the background image is accessible or use an uploaded image instead of a URL.');
  }
};

/**
 * Upload badge image to storage
 * Returns both the public URL and the file path
 */
const uploadBadgeImageToStorage = async (
  userId: string,
  base64Data: string,
  filename?: string
): Promise<{ url: string; path: string }> => {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    // Create a unique filename
    const timestamp = Date.now();
    const fileExtension = base64Data.includes('image/png') ? 'png' : 
                         base64Data.includes('image/jpeg') || base64Data.includes('image/jpg') ? 'jpg' : 
                         'png';
    const finalFilename = filename || `badge-${timestamp}.${fileExtension}`;
    
    // Convert blob to File
    const file = new File([blob], finalFilename, { type: blob.type });
    
    // Generate unique filename
    const fileExt = finalFilename.split('.').pop() || 'png';
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Upload the file to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.PARTICIPANT_BADGE)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.PARTICIPANT_BADGE)
      .getPublicUrl(data.path);
    
    return { url: urlData.publicUrl, path: data.path };
  } catch (error: any) {
    console.error('Error uploading badge image to storage:', error);
    throw new Error(error.message || 'Failed to upload badge image. Please try again.');
  }
};

/**
 * Generate and save a badge for a participant
 */
export const generateAndSaveBadge = async (
  userId: string,
  eventId: string,
  formSubmissionId: string,
  badgeTemplateId: string,
  submission: FormSubmission
): Promise<ParticipantBadge> => {
  try {
    // Get the badge template
    const template = await getBadgeTemplate(badgeTemplateId);
    if (!template) {
      throw new Error('Badge template not found');
    }

    // Determine registration type
    const registrationType: 'internal' | 'external' = submission.participantUserId ? 'internal' : 'external';

    // Check if template has QR codes
    const hasQRCodes = template.elements.some(el => el.type === 'qr');

    let badgeImageData: string;
    let badgeImageUrl: string;

    if (hasQRCodes) {
      // If template has QR codes, we need to:
      // 1. Generate a temporary badge (without QR code) to upload and get storage URL
      // 2. Generate the final badge with QR code pointing to that URL
      // 3. Update the uploaded image with the final one (with QR code)

      // Step 1: Generate temporary badge without QR code
      const tempBadgeImageData = await generateBadgeImage(template, submission);

      // Step 2: Upload temporary badge to get storage URL and path
      const { url: tempBadgeImageUrl, path: filePath } = await uploadBadgeImageToStorage(userId, tempBadgeImageData);

      // Step 3: Generate final badge with QR code pointing to the badge URL
      badgeImageData = await generateBadgeImage(template, submission, tempBadgeImageUrl);

      // Step 4: Update the uploaded image with the final one (with QR code)
      const imageBlob = await fetch(badgeImageData).then(r => r.blob());
      const file = new File([imageBlob], `badge-${Date.now()}.png`, { type: 'image/png' });
      
      // Update the file in storage using the stored path
      const { error: updateError } = await supabase.storage
        .from(STORAGE_BUCKETS.PARTICIPANT_BADGE)
        .update(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (updateError) {
        console.error('Error updating badge with QR code:', updateError);
        // Continue with the temporary URL if update fails
        badgeImageUrl = tempBadgeImageUrl;
      } else {
        badgeImageUrl = tempBadgeImageUrl; // Same URL, just updated content
      }
    } else {
      // No QR codes, generate badge directly
      badgeImageData = await generateBadgeImage(template, submission);
      const uploadResult = await uploadBadgeImageToStorage(userId, badgeImageData);
      badgeImageUrl = uploadResult.url;
    }

    // Get participant information
    const participantName = submission.generalInfo?.name || 
                           submission.answers['general_name'] as string || 
                           submission.submittedBy || 
                           'Participant';
    const participantEmail = submission.generalInfo?.email || 
                             submission.answers['general_email'] as string || 
                             undefined;
    const participantPhone = submission.generalInfo?.phone || 
                             submission.answers['general_phone'] as string || 
                             undefined;
    const participantOrganization = submission.generalInfo?.organization || 
                                   submission.answers['general_organization'] as string || 
                                   undefined;

    // Check if badge already exists for this submission
    const { data: existingBadge } = await supabase
      .from(TABLES.PARTICIPANTS_BADGE)
      .select('*')
      .eq('form_submission_id', formSubmissionId)
      .single();

    let badgeData: ParticipantBadge;

    if (existingBadge) {
      // Update existing badge
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANTS_BADGE)
        .update({
          badge_template_id: badgeTemplateId,
          badge_image_url: badgeImageUrl,
          participant_name: participantName,
          participant_email: participantEmail || null,
          participant_phone: participantPhone || null,
          participant_organization: participantOrganization || null,
          registration_type: registrationType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBadge.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      badgeData = {
        id: data.id,
        userId: data.user_id,
        eventId: data.event_id,
        formSubmissionId: data.form_submission_id,
        badgeTemplateId: data.badge_template_id,
        badgeImageUrl: data.badge_image_url,
        participantName: data.participant_name,
        participantEmail: data.participant_email || undefined,
        participantPhone: data.participant_phone || undefined,
        participantOrganization: data.participant_organization || undefined,
        registrationType: data.registration_type as 'internal' | 'external',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } else {
      // Create new badge
      const { data, error } = await supabase
        .from(TABLES.PARTICIPANTS_BADGE)
        .insert({
          user_id: userId,
          event_id: eventId,
          form_submission_id: formSubmissionId,
          badge_template_id: badgeTemplateId,
          badge_image_url: badgeImageUrl,
          participant_name: participantName,
          participant_email: participantEmail || null,
          participant_phone: participantPhone || null,
          participant_organization: participantOrganization || null,
          registration_type: registrationType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      badgeData = {
        id: data.id,
        userId: data.user_id,
        eventId: data.event_id,
        formSubmissionId: data.form_submission_id,
        badgeTemplateId: data.badge_template_id,
        badgeImageUrl: data.badge_image_url,
        participantName: data.participant_name,
        participantEmail: data.participant_email || undefined,
        participantPhone: data.participant_phone || undefined,
        participantOrganization: data.participant_organization || undefined,
        registrationType: data.registration_type as 'internal' | 'external',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    }

    return badgeData;
  } catch (error: any) {
    console.error('Error generating and saving badge:', error);
    throw new Error(error.message || 'Failed to generate and save badge');
  }
};

/**
 * Get badge for a form submission
 */
export const getBadgeForSubmission = async (
  formSubmissionId: string
): Promise<ParticipantBadge | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANTS_BADGE)
      .select('*')
      .eq('form_submission_id', formSubmissionId)
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
      formSubmissionId: data.form_submission_id,
      badgeTemplateId: data.badge_template_id,
      badgeImageUrl: data.badge_image_url,
      participantName: data.participant_name,
      participantEmail: data.participant_email || undefined,
      participantPhone: data.participant_phone || undefined,
      participantOrganization: data.participant_organization || undefined,
      registrationType: data.registration_type as 'internal' | 'external',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting badge for submission:', error);
    throw error;
  }
};

/**
 * Get all badges for an event
 */
export const getBadgesForEvent = async (
  eventId: string
): Promise<ParticipantBadge[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANTS_BADGE)
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map(doc => ({
      id: doc.id,
      userId: doc.user_id,
      eventId: doc.event_id,
      formSubmissionId: doc.form_submission_id,
      badgeTemplateId: doc.badge_template_id,
      badgeImageUrl: doc.badge_image_url,
      participantName: doc.participant_name,
      participantEmail: doc.participant_email || undefined,
      participantPhone: doc.participant_phone || undefined,
      participantOrganization: doc.participant_organization || undefined,
      registrationType: doc.registration_type as 'internal' | 'external',
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.updated_at),
    }));
  } catch (error: any) {
    console.error('Error getting badges for event:', error);
    throw error;
  }
};

/**
 * Get badge by its image URL (used for QR code scanning)
 */
export const getBadgeByImageUrl = async (
  badgeImageUrl: string
): Promise<ParticipantBadge | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANTS_BADGE)
      .select('*')
      .eq('badge_image_url', badgeImageUrl)
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
      formSubmissionId: data.form_submission_id,
      badgeTemplateId: data.badge_template_id,
      badgeImageUrl: data.badge_image_url,
      participantName: data.participant_name,
      participantEmail: data.participant_email || undefined,
      participantPhone: data.participant_phone || undefined,
      participantOrganization: data.participant_organization || undefined,
      registrationType: data.registration_type as 'internal' | 'external',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } catch (error: any) {
    console.error('Error getting badge by image URL:', error);
    throw error;
  }
};
