import { supabase, TABLES, STORAGE_BUCKETS } from '../supabase';
import { uploadBase64ImageToStorage } from './storageService';

const TABLE_NAME = TABLES.CERTIFICATES;

export type CertificateScope = 'registration' | 'submission';

export const buildCertificateViewUrl = (certificateId: string): string =>
  `${window.location.origin}/certificate/${certificateId}`;

export const buildCertificateImageStoragePath = (
  userId: string,
  certificateId: string
): string => `${userId}/certificates/${certificateId}.png`;

export const buildCertificatePdfStoragePath = (
  userId: string,
  certificateId: string
): string => `${userId}/certificates/${certificateId}.pdf`;

export const getCertificateImagePublicUrl = (storagePath: string): string => {
  const { data } = supabase.storage.from(STORAGE_BUCKETS.MEDIA).getPublicUrl(storagePath);
  return data.publicUrl;
};

export const getCertificatePdfPublicUrl = (storagePath: string): string =>
  getCertificateImagePublicUrl(storagePath);

/** Public Supabase PDF URL encoded in certificate QR codes. */
export const resolveCertificateQrPdfUrl = (
  organizerUserId: string,
  certificateId: string,
  existingPdfUrl?: string | null
): string =>
  existingPdfUrl ||
  getCertificatePdfPublicUrl(buildCertificatePdfStoragePath(organizerUserId, certificateId));

export const getCertificateQrPdfUrl = (cert: Certificate): string =>
  cert.certificatePdfUrl ||
  (cert.certificateUrl?.toLowerCase().includes('.pdf') ? cert.certificateUrl : '') ||
  resolveCertificateQrPdfUrl(cert.userId, cert.id);

export const parseCertificateStoragePath = (imageUrl: string): string | null => {
  const match = imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
};

const uploadStorageBlob = async (
  storagePath: string,
  blob: Blob,
  filename: string,
  bucket: string = STORAGE_BUCKETS.MEDIA
): Promise<string> => {
  const file = new File([blob], filename, { type: blob.type });
  const { error } = await supabase.storage.from(bucket).upload(storagePath, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw error;
  return getCertificateImagePublicUrl(storagePath);
};

const uploadCertificateImageBlob = async (
  storagePath: string,
  imageBlob: Blob,
  bucket: string = STORAGE_BUCKETS.MEDIA
): Promise<string> => uploadStorageBlob(storagePath, imageBlob, 'certificate.png', bucket);

const uploadCertificatePdfData = async (
  userId: string,
  pdfBlob: Blob,
  certificateId?: string,
  existingPdfUrl?: string | null
): Promise<string> => {
  const existingPath = existingPdfUrl ? parseCertificateStoragePath(existingPdfUrl) : null;
  if (existingPath) {
    return uploadStorageBlob(existingPath, pdfBlob, 'certificate.pdf');
  }
  if (certificateId) {
    return uploadStorageBlob(
      buildCertificatePdfStoragePath(userId, certificateId),
      pdfBlob,
      'certificate.pdf'
    );
  }
  const storagePath = `${userId}/certificates/${Date.now()}-${Math.random().toString(36).substring(2)}.pdf`;
  return uploadStorageBlob(storagePath, pdfBlob, 'certificate.pdf');
};

export interface Certificate {
  id: string;
  userId: string;
  eventId: string;
  templateId: string;
  participantSubmissionId: string;
  certificateImageUrl: string;
  certificatePdfUrl?: string;
  certificateUrl: string;
  participantName: string;
  participantEmail?: string;
  participantUserId?: string;
  certificateScope?: CertificateScope;
  createdAt: Date;
}

export interface ParticipantAccountCertificate extends Certificate {
  participantUserId: string;
  certificateScope: CertificateScope;
}

const mapCertificateRow = (data: Record<string, unknown>): Certificate => ({
  id: data.id as string,
  userId: data.user_id as string,
  eventId: data.event_id as string,
  templateId: data.template_id as string,
  participantSubmissionId: data.participant_submission_id as string,
  certificateImageUrl: data.certificate_image_url as string,
  certificatePdfUrl: data.certificate_pdf_url as string | undefined,
  certificateUrl:
    (data.certificate_pdf_url as string) ||
    (data.certificate_url as string) ||
    `${window.location.origin}/certificate/${data.id as string}`,
  participantName: data.participant_name as string,
  participantEmail: data.participant_email as string | undefined,
  participantUserId: data.participant_user_id as string | undefined,
  certificateScope: data.certificate_scope as CertificateScope | undefined,
  createdAt: new Date(data.created_at as string),
});

const uploadCertificateImageData = async (
  userId: string,
  certificateImageData: string,
  certificateId?: string,
  existingImageUrl?: string | null
): Promise<string> => {
  const imageBlob = await fetch(certificateImageData).then((r) => r.blob());
  const existingPath = existingImageUrl ? parseCertificateStoragePath(existingImageUrl) : null;

  if (existingPath) {
    return uploadCertificateImageBlob(existingPath, imageBlob);
  }

  if (certificateId) {
    const storagePath = buildCertificateImageStoragePath(userId, certificateId);
    return uploadCertificateImageBlob(storagePath, imageBlob);
  }

  const file = new File([imageBlob], `certificate-${Date.now()}.png`, { type: 'image/png' });

  try {
    return await uploadBase64ImageToStorage(
      userId,
      certificateImageData,
      'certificates',
      `certificate-${Date.now()}.png`
    );
  } catch (bucketError: unknown) {
    const message = bucketError instanceof Error ? bucketError.message : '';
    if (!message.includes('Bucket not found') && !message.includes('bucket')) {
      throw bucketError;
    }

    const fileName = `${userId}/certificates/${Date.now()}-${Math.random().toString(36).substring(2)}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.GENERAL)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.GENERAL)
      .getPublicUrl(uploadData.path);

    return urlData.publicUrl;
  }
};

/**
 * Save a generated certificate
 */
export const saveCertificate = async (
  userId: string,
  eventId: string,
  templateId: string,
  participantSubmissionId: string,
  certificateImageData: string,
  participantName: string,
  participantEmail?: string,
  certificateId?: string,
  certificatePdfBlob?: Blob | null
): Promise<Certificate> => {
  try {
    const finalCertificateId = certificateId || crypto.randomUUID();
    const certificateImageUrl = await uploadCertificateImageData(
      userId,
      certificateImageData,
      finalCertificateId
    );
    const certificatePdfUrl = certificatePdfBlob
      ? await uploadCertificatePdfData(userId, certificatePdfBlob, finalCertificateId)
      : resolveCertificateQrPdfUrl(userId, finalCertificateId);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        id: finalCertificateId,
        user_id: userId,
        event_id: eventId,
        template_id: templateId,
        participant_submission_id: participantSubmissionId,
        certificate_image_url: certificateImageUrl,
        certificate_pdf_url: certificatePdfUrl,
        certificate_url: certificatePdfUrl,
        participant_name: participantName,
        participant_email: participantEmail,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return mapCertificateRow(data);
  } catch (error: unknown) {
    console.error('Error saving certificate:', error);
    const message = error instanceof Error ? error.message : 'Failed to save certificate';
    throw new Error(message);
  }
};

/**
 * Save or update a certificate on a participant account (Participations → Certificates).
 */
export const findParticipantAccountCertificateId = async (
  participantSubmissionId: string,
  participantUserId: string,
  certificateScope: CertificateScope
): Promise<string | null> => {
  const { data } = await supabase
    .from(TABLE_NAME)
    .select('id')
    .eq('participant_submission_id', participantSubmissionId)
    .eq('certificate_scope', certificateScope)
    .eq('participant_user_id', participantUserId)
    .maybeSingle();

  return data?.id ?? null;
};

export const saveParticipantAccountCertificate = async (
  organizerUserId: string,
  eventId: string,
  templateId: string,
  participantSubmissionId: string,
  participantUserId: string,
  certificateScope: CertificateScope,
  certificateImageData: string,
  participantName: string,
  participantEmail?: string,
  certificateId?: string,
  certificatePdfBlob?: Blob | null
): Promise<ParticipantAccountCertificate> => {
  try {
    const { data: existing } = await supabase
      .from(TABLE_NAME)
      .select('id, certificate_url, certificate_image_url, certificate_pdf_url')
      .eq('participant_submission_id', participantSubmissionId)
      .eq('certificate_scope', certificateScope)
      .eq('participant_user_id', participantUserId)
      .maybeSingle();

    const finalCertificateId = certificateId || existing?.id || crypto.randomUUID();
    const certificateImageUrl = await uploadCertificateImageData(
      organizerUserId,
      certificateImageData,
      finalCertificateId,
      existing?.certificate_image_url
    );
    const certificatePdfUrl = certificatePdfBlob
      ? await uploadCertificatePdfData(
          organizerUserId,
          certificatePdfBlob,
          finalCertificateId,
          existing?.certificate_pdf_url
        )
      : resolveCertificateQrPdfUrl(
          organizerUserId,
          finalCertificateId,
          existing?.certificate_pdf_url
        );

    const row = {
      id: finalCertificateId,
      user_id: organizerUserId,
      event_id: eventId,
      template_id: templateId,
      participant_submission_id: participantSubmissionId,
      participant_user_id: participantUserId,
      certificate_scope: certificateScope,
      certificate_image_url: certificateImageUrl,
      certificate_pdf_url: certificatePdfUrl,
      certificate_url: certificatePdfUrl,
      participant_name: participantName,
      participant_email: participantEmail,
      created_at: new Date().toISOString(),
    };

    const { data, error } = existing
      ? await supabase.from(TABLE_NAME).update(row).eq('id', finalCertificateId).select().single()
      : await supabase.from(TABLE_NAME).insert(row).select().single();

    if (error) throw error;

    const mapped = mapCertificateRow(data);
    return {
      ...mapped,
      participantUserId,
      certificateScope,
    };
  } catch (error: unknown) {
    console.error('Error saving participant account certificate:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to add certificate to participant account';
    throw new Error(message);
  }
};

/**
 * Certificates published to a participant account, optionally filtered by scope.
 */
export const getParticipantAccountCertificates = async (
  participantUserId: string,
  scope?: CertificateScope
): Promise<ParticipantAccountCertificate[]> => {
  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('participant_user_id', participantUserId)
    .not('certificate_scope', 'is', null)
    .order('created_at', { ascending: false });

  if (scope) {
    query = query.eq('certificate_scope', scope);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((row) => {
    const mapped = mapCertificateRow(row);
    return {
      ...mapped,
      participantUserId: mapped.participantUserId!,
      certificateScope: mapped.certificateScope!,
    };
  });
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
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;

    return mapCertificateRow(data);
  } catch (error: unknown) {
    console.error('Error getting certificate:', error);
    throw error;
  }
};
