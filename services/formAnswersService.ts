import { supabase, TABLES } from '../supabase';
import { RegistrationForm } from '../types';

export interface FormAnswer {
  id: string;
  submissionId: string;
  formId: string;
  fieldId: string;
  fieldLabel: string;
  answerValue: string | null;
  answerType: 'text' | 'number' | 'date' | 'file' | 'array' | 'object' | 'boolean';
  isGeneralInfo: boolean;
  registrationType?: 'internal' | 'external';
  createdAt: Date;
}

/**
 * Determine answer type from value
 */
const getAnswerType = (value: any): FormAnswer['answerType'] => {
  if (value === null || value === undefined) {
    return 'text';
  }
  
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  
  if (typeof value === 'number') {
    return 'number';
  }
  
  if (Array.isArray(value)) {
    return 'array';
  }
  
  if (typeof value === 'object') {
    return 'object';
  }
  
  if (typeof value === 'string') {
    // Check if it's a date (ISO format)
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return 'date';
    }
    
    // Check if it's a file URL
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return 'file';
    }
  }
  
  return 'text';
};

/**
 * Serialize answer value to string
 */
const serializeAnswerValue = (value: any): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  // For arrays and objects, serialize to JSON
  if (Array.isArray(value) || typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
};

/**
 * Get field label from form
 */
const getFieldLabel = (form: RegistrationForm, fieldId: string): string => {
  // Check general info fields
  if (fieldId === 'general_name' && form.generalInfo.collectName) return 'Full Name';
  if (fieldId === 'general_email' && form.generalInfo.collectEmail) return 'Email';
  if (fieldId === 'general_phone' && form.generalInfo.collectPhone) return 'Phone';
  if (fieldId === 'general_organization' && form.generalInfo.collectOrganization) return 'Organization';
  if (fieldId === 'general_address' && form.generalInfo.collectAddress) return 'Address';
  
  // Check sections
  for (const section of form.sections || []) {
    for (const field of section.fields || []) {
      if (field.id === fieldId) return field.label;
    }
    for (const subsection of section.subsections || []) {
      for (const field of subsection.fields || []) {
        if (field.id === fieldId) return field.label;
      }
    }
  }
  
  // Check legacy fields
  for (const field of form.fields || []) {
    if (field.id === fieldId) return field.label;
  }
  
  return fieldId; // Fallback to field ID
};

/**
 * Check if field is a general info field
 */
const isGeneralInfoField = (fieldId: string): boolean => {
  return fieldId.startsWith('general_');
};

/**
 * Save answers to registration forms answers table
 */
export const saveRegistrationFormAnswers = async (
  submissionId: string,
  formId: string,
  form: RegistrationForm,
  answers: Record<string, any>,
  participantUserId?: string | null
): Promise<void> => {
  try {
    // Determine registration type: internal if participantUserId exists, external otherwise
    const registrationType: 'internal' | 'external' = participantUserId ? 'internal' : 'external';
    
    const answerRecords = Object.entries(answers).map(([fieldId, value]) => ({
      submission_id: submissionId,
      form_id: formId,
      field_id: fieldId,
      field_label: getFieldLabel(form, fieldId),
      answer_value: serializeAnswerValue(value),
      answer_type: getAnswerType(value),
      is_general_info: isGeneralInfoField(fieldId),
      registration_type: registrationType,
    }));
    
    if (answerRecords.length === 0) {
      return;
    }
    
    const { error } = await supabase
      .from(TABLES.REGISTRATION_FORMS_ANSWERS)
      .insert(answerRecords);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error saving registration form answers:', error);
    throw error;
  }
};

/**
 * Save answers to submissions answers table
 */
export const saveSubmissionAnswers = async (
  submissionId: string,
  formId: string,
  form: RegistrationForm,
  answers: Record<string, any>
): Promise<void> => {
  try {
    const answerRecords = Object.entries(answers).map(([fieldId, value]) => ({
      submission_id: submissionId,
      form_id: formId,
      field_id: fieldId,
      field_label: getFieldLabel(form, fieldId),
      answer_value: serializeAnswerValue(value),
      answer_type: getAnswerType(value),
      is_general_info: isGeneralInfoField(fieldId),
    }));
    
    if (answerRecords.length === 0) {
      return;
    }
    
    const { error } = await supabase
      .from(TABLES.SUBMISSIONS_ANSWERS)
      .insert(answerRecords);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error saving submission answers:', error);
    throw error;
  }
};

/**
 * Get answers for a submission (from registration forms answers)
 */
export const getRegistrationFormAnswers = async (
  submissionId: string
): Promise<FormAnswer[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.REGISTRATION_FORMS_ANSWERS)
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    return data.map(doc => ({
      id: doc.id,
      submissionId: doc.submission_id,
      formId: doc.form_id,
      fieldId: doc.field_id,
      fieldLabel: doc.field_label,
      answerValue: doc.answer_value,
      answerType: doc.answer_type,
      isGeneralInfo: doc.is_general_info,
      registrationType: doc.registration_type as 'internal' | 'external' | undefined,
      createdAt: new Date(doc.created_at),
    }));
  } catch (error) {
    console.error('Error getting registration form answers:', error);
    throw error;
  }
};

/**
 * Get answers for a submission (from submissions answers)
 */
export const getSubmissionAnswers = async (
  submissionId: string
): Promise<FormAnswer[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.SUBMISSIONS_ANSWERS)
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    return data.map(doc => ({
      id: doc.id,
      submissionId: doc.submission_id,
      formId: doc.form_id,
      fieldId: doc.field_id,
      fieldLabel: doc.field_label,
      answerValue: doc.answer_value,
      answerType: doc.answer_type,
      isGeneralInfo: doc.is_general_info,
      registrationType: doc.registration_type as 'internal' | 'external' | undefined,
      createdAt: new Date(doc.created_at),
    }));
  } catch (error) {
    console.error('Error getting submission answers:', error);
    throw error;
  }
};

/**
 * Convert answers array back to answers object format
 */
export const answersArrayToObject = (answers: FormAnswer[]): Record<string, any> => {
  const result: Record<string, any> = {};
  
  for (const answer of answers) {
    let value: any = answer.answerValue;
    
    // Deserialize based on type
    if (answer.answerType === 'array' || answer.answerType === 'object') {
      try {
        value = JSON.parse(answer.answerValue || 'null');
      } catch {
        value = answer.answerValue;
      }
    } else if (answer.answerType === 'number') {
      value = Number(answer.answerValue);
    } else if (answer.answerType === 'boolean') {
      value = answer.answerValue === 'true';
    }
    
    result[answer.fieldId] = value;
  }
  
  return result;
};

