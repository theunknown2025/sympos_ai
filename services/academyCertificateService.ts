import { supabase, TABLES } from '../supabase';
import type { AcademyCertificate } from '../types';

const CERTIFICATES_TABLE = TABLES.ACADEMY_CERTIFICATES;
const ENROLLMENTS_TABLE = TABLES.ACADEMY_ENROLLMENTS;

const mapCertificateRow = (row: any): AcademyCertificate => ({
  id: row.id,
  courseId: row.course_id,
  participantUserId: row.participant_user_id,
  certificateTemplateId: row.certificate_template_id ?? undefined,
  issuedAt: new Date(row.issued_at || row.created_at),
  verificationCode: row.verification_code ?? undefined,
  metadata: row.metadata ?? undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

const generateVerificationCode = (): string => {
  // Simple short verification code
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export interface IssueCertificateInput {
  enrollmentId: string;
  certificateTemplateId?: string;
  metadata?: any;
}

export const issueCertificateForEnrollment = async (
  input: IssueCertificateInput
): Promise<AcademyCertificate> => {
  const { data: enrollment, error: enrollmentError } = await supabase
    .from(ENROLLMENTS_TABLE)
    .select('id, course_id, participant_user_id, status')
    .eq('id', input.enrollmentId)
    .single();

  if (enrollmentError) {
    console.error('Error fetching enrollment for certificate issuance:', enrollmentError);
    throw new Error(enrollmentError.message || 'Failed to issue certificate');
  }

  if (enrollment.status !== 'completed') {
    throw new Error('Certificate can only be issued for completed enrollments');
  }

  // Check if certificate already exists
  const { data: existing, error: existingError } = await supabase
    .from(CERTIFICATES_TABLE)
    .select('*')
    .eq('course_id', enrollment.course_id)
    .eq('participant_user_id', enrollment.participant_user_id)
    .maybeSingle();

  if (existingError) {
    console.error('Error checking existing Academy certificate:', existingError);
    throw new Error(existingError.message || 'Failed to issue certificate');
  }

  if (existing) {
    return mapCertificateRow(existing);
  }

  const verificationCode = generateVerificationCode();

  const { data, error } = await supabase
    .from(CERTIFICATES_TABLE)
    .insert({
      course_id: enrollment.course_id,
      participant_user_id: enrollment.participant_user_id,
      certificate_template_id: input.certificateTemplateId || null,
      issued_at: new Date().toISOString(),
      verification_code: verificationCode,
      metadata: input.metadata || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting Academy certificate:', error);
    throw new Error(error.message || 'Failed to issue certificate');
  }

  return mapCertificateRow(data);
};

export const getCertificatesForParticipant = async (
  participantUserId: string
): Promise<AcademyCertificate[]> => {
  const { data, error } = await supabase
    .from(CERTIFICATES_TABLE)
    .select('*')
    .eq('participant_user_id', participantUserId)
    .order('issued_at', { ascending: false });

  if (error) {
    console.error('Error fetching Academy certificates for participant:', error);
    throw new Error(error.message || 'Failed to fetch certificates');
  }

  return (data || []).map((row: any) => mapCertificateRow(row));
};

export const getCertificatesForCourse = async (
  courseId: string
): Promise<AcademyCertificate[]> => {
  const { data, error } = await supabase
    .from(CERTIFICATES_TABLE)
    .select('*')
    .eq('course_id', courseId)
    .order('issued_at', { ascending: false });

  if (error) {
    console.error('Error fetching Academy certificates for course:', error);
    throw new Error(error.message || 'Failed to fetch certificates');
  }

  return (data || []).map((row: any) => mapCertificateRow(row));
};

export const verifyCertificate = async (
  verificationCode: string
): Promise<AcademyCertificate | null> => {
  const { data, error } = await supabase
    .from(CERTIFICATES_TABLE)
    .select('*')
    .eq('verification_code', verificationCode)
    .maybeSingle();

  if (error) {
    console.error('Error verifying Academy certificate:', error);
    throw new Error(error.message || 'Failed to verify certificate');
  }

  if (!data) {
    return null;
  }

  return mapCertificateRow(data);
};

