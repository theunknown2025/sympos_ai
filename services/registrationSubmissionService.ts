import { supabase, TABLES } from '../supabase';
import { FormSubmission, DecisionStatus } from '../types';
import { getRegistrationForm } from './registrationFormService';
import { saveRegistrationFormAnswers, saveSubmissionAnswers } from './formAnswersService';

export type { FormSubmission, DecisionStatus };

const TABLE_NAME = TABLES.FORM_SUBMISSIONS;

/**
 * Save a form submission
 */
export const saveFormSubmission = async (
  submission: Omit<FormSubmission, 'id' | 'submittedAt'>
): Promise<string> => {
  try {
    // Serialize JSON fields for Supabase storage
    const insertData: any = {
      form_id: submission.formId,
      event_id: submission.eventId,
      event_title: submission.eventTitle,
      user_id: submission.userId,
      participant_user_id: submission.participantUserId || null,
      submitted_by: submission.submittedBy,
      subscription_type: submission.subscriptionType,
      entity_name: submission.entityName || null,
      role: submission.role,
    };
    if (submission.generalInfo !== undefined) {
      insertData.general_info = JSON.stringify(submission.generalInfo);
    }
    if (submission.answers !== undefined) {
      insertData.answers = JSON.stringify(submission.answers);
    }
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    const submissionId = data.id;
    
    // Also save answers to dedicated tables for better handling
    if (submission.answers && Object.keys(submission.answers).length > 0) {
      try {
        // Load form to get field labels
        const form = await getRegistrationForm(submission.formId);
        if (form) {
          // Determine if this is a registration form or submission form based on title prefix
          const titleLower = form.title.toLowerCase();
          const isSubmissionForm = titleLower.startsWith('sub - ') || titleLower.startsWith('sub-') || 
                                   titleLower.includes('submission') || titleLower.includes('submit');
          
          if (isSubmissionForm) {
            // Save to submissions_answers table
            await saveSubmissionAnswers(submissionId, submission.formId, form, submission.answers);
          } else {
            // Save to registration_forms_answers table
            await saveRegistrationFormAnswers(submissionId, submission.formId, form, submission.answers, submission.participantUserId);
          }
        }
      } catch (answerError) {
        // Log error but don't fail the submission
        console.error('Error saving answers to dedicated tables:', answerError);
        // Continue - the answers are still saved in the form_submissions table as JSON
      }
    }
    
    return submissionId;
  } catch (error) {
    console.error('Error saving form submission:', error);
    throw error;
  }
};

/**
 * Get all submissions for a specific event
 * This includes submissions where event_id matches OR accepted_event_id matches
 */
export const getEventSubmissions = async (
  eventId: string
): Promise<FormSubmission[]> => {
  try {
    // Query submissions where either event_id or accepted_event_id matches the eventId
    // Use OR condition: (event_id = eventId) OR (accepted_event_id = eventId)
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .or(`event_id.eq.${eventId},accepted_event_id.eq.${eventId}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    const submissions = data.map(doc => {
      // Deserialize JSON fields from Supabase storage
      const generalInfo = typeof doc.general_info === 'string' 
        ? JSON.parse(doc.general_info) 
        : (doc.general_info || {});
      const answers = typeof doc.answers === 'string' 
        ? JSON.parse(doc.answers) 
        : (doc.answers || {});
      
      return {
        id: doc.id,
        formId: doc.form_id,
        eventId: doc.event_id,
        eventTitle: doc.event_title,
        userId: doc.user_id,
        participantUserId: doc.participant_user_id || undefined,
        submittedBy: doc.submitted_by,
        subscriptionType: (doc.subscription_type as 'self' | 'entity') || 'self',
        entityName: doc.entity_name || undefined,
        role: (doc.role as 'Organizer' | 'Participant') || 'Participant',
        generalInfo: generalInfo,
        answers: answers,
        submittedAt: new Date(doc.created_at),
        decisionStatus: doc.decision_status || undefined,
        decisionComment: doc.decision_comment || undefined,
        decisionDate: doc.decision_date ? new Date(doc.decision_date) : undefined,
        decidedBy: doc.decided_by || undefined,
        acceptedEventId: doc.accepted_event_id || undefined,
        dispatchingStatus: doc.dispatching_status || undefined,
        approvalStatus: doc.approval_status || undefined,
      };
    });
    
    // Sort by submittedAt descending (already sorted by query, but ensure)
    return submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  } catch (error) {
    console.error('Error getting event submissions:', error);
    throw error;
  }
};

/**
 * Get all submissions for a user (all events they manage)
 * This gets submissions where user_id = form creator (organizer)
 */
export const getUserSubmissions = async (
  userId: string
): Promise<FormSubmission[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    const submissions = data.map(doc => {
      // Deserialize JSON fields from Supabase storage
      const generalInfo = typeof doc.general_info === 'string' 
        ? JSON.parse(doc.general_info) 
        : (doc.general_info || {});
      const answers = typeof doc.answers === 'string' 
        ? JSON.parse(doc.answers) 
        : (doc.answers || {});
      
      return {
        id: doc.id,
        formId: doc.form_id,
        eventId: doc.event_id,
        eventTitle: doc.event_title,
        userId: doc.user_id,
        participantUserId: doc.participant_user_id || undefined,
        submittedBy: doc.submitted_by,
        subscriptionType: (doc.subscription_type as 'self' | 'entity') || 'self',
        entityName: doc.entity_name || undefined,
        role: (doc.role as 'Organizer' | 'Participant') || 'Participant',
        generalInfo: generalInfo,
        answers: answers,
        submittedAt: new Date(doc.created_at),
        decisionStatus: doc.decision_status || undefined,
        decisionComment: doc.decision_comment || undefined,
        decisionDate: doc.decision_date ? new Date(doc.decision_date) : undefined,
        decidedBy: doc.decided_by || undefined,
        acceptedEventId: doc.accepted_event_id || undefined,
        dispatchingStatus: doc.dispatching_status || undefined,
        approvalStatus: doc.approval_status || undefined,
      };
    });
    
    // Sort by submittedAt descending
    return submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  } catch (error) {
    console.error('Error getting user submissions:', error);
    throw error;
  }
};

/**
 * Get submissions for forms created by a user (for submission forms specifically)
 * This joins with registration_forms to get submissions for forms the user created
 */
export const getSubmissionsForUserForms = async (
  userId: string,
  formIds?: string[]
): Promise<FormSubmission[]> => {
  try {
    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // If formIds provided, filter by them
    if (formIds && formIds.length > 0) {
      query = query.in('form_id', formIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    const submissions = data.map(doc => {
      // Deserialize JSON fields from Supabase storage
      const generalInfo = typeof doc.general_info === 'string' 
        ? JSON.parse(doc.general_info) 
        : (doc.general_info || {});
      const answers = typeof doc.answers === 'string' 
        ? JSON.parse(doc.answers) 
        : (doc.answers || {});
      
      return {
        id: doc.id,
        formId: doc.form_id,
        eventId: doc.event_id,
        eventTitle: doc.event_title,
        userId: doc.user_id,
        participantUserId: doc.participant_user_id || undefined,
        submittedBy: doc.submitted_by,
        subscriptionType: (doc.subscription_type as 'self' | 'entity') || 'self',
        entityName: doc.entity_name || undefined,
        role: (doc.role as 'Organizer' | 'Participant') || 'Participant',
        generalInfo: generalInfo,
        answers: answers,
        submittedAt: new Date(doc.created_at),
        decisionStatus: doc.decision_status || undefined,
        decisionComment: doc.decision_comment || undefined,
        decisionDate: doc.decision_date ? new Date(doc.decision_date) : undefined,
        decidedBy: doc.decided_by || undefined,
        acceptedEventId: doc.accepted_event_id || undefined,
        dispatchingStatus: doc.dispatching_status || undefined,
        approvalStatus: doc.approval_status || undefined,
      };
    });
    
    // Sort by submittedAt descending
    return submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  } catch (error) {
    console.error('Error getting submissions for user forms:', error);
    throw error;
  }
};

/**
 * Get all submissions submitted by a specific user (by email or user ID)
 * This gets submissions where participant_user_id matches the user's ID OR submitted_by matches the user's email(s)
 * Also checks general_info JSON for email matches
 */
export const getRegistrationSubmissions = async (
  userEmail: string,
  userId?: string,
  juryMemberEmail?: string
): Promise<FormSubmission[]> => {
  try {
    // Collect all possible emails to search for
    const emailsToSearch = [userEmail];
    if (juryMemberEmail && juryMemberEmail !== userEmail) {
      emailsToSearch.push(juryMemberEmail);
    }
    
    // Build query: filter by participant_user_id OR submitted_by email
    let query = supabase
      .from(TABLE_NAME)
      .select('*');
    
    // If userId is provided, filter by participant_user_id OR submitted_by email
    if (userId) {
      // Use OR condition: (participant_user_id = userId) OR (submitted_by matches any email)
      // For multiple emails, we need to create OR conditions for each email
      if (emailsToSearch.length === 1) {
        // Single email: (participant_user_id = userId) OR (submitted_by = email)
        query = query.or(`participant_user_id.eq.${userId},submitted_by.eq.${emailsToSearch[0]}`);
      } else {
        // Multiple emails: (participant_user_id = userId) OR (submitted_by = email1) OR (submitted_by = email2) ...
        const emailConditions = emailsToSearch.map(email => `submitted_by.eq.${email}`).join(',');
        query = query.or(`participant_user_id.eq.${userId},${emailConditions}`);
      }
    } else {
      // Fallback to email-only search if no userId provided
      if (emailsToSearch.length === 1) {
        query = query.eq('submitted_by', emailsToSearch[0]);
      } else {
        query = query.in('submitted_by', emailsToSearch);
      }
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    const submissions = (data || []).map(doc => {
      // Deserialize JSON fields from Supabase storage
      const generalInfo = typeof doc.general_info === 'string' 
        ? JSON.parse(doc.general_info) 
        : (doc.general_info || {});
      const answers = typeof doc.answers === 'string' 
        ? JSON.parse(doc.answers) 
        : (doc.answers || {});
      
      return {
        id: doc.id,
        formId: doc.form_id,
        eventId: doc.event_id,
        eventTitle: doc.event_title,
        userId: doc.user_id,
        participantUserId: doc.participant_user_id || undefined,
        submittedBy: doc.submitted_by,
        subscriptionType: (doc.subscription_type as 'self' | 'entity') || 'self',
        entityName: doc.entity_name || undefined,
        role: (doc.role as 'Organizer' | 'Participant') || 'Participant',
        generalInfo: generalInfo,
        answers: answers,
        submittedAt: new Date(doc.created_at),
        decisionStatus: doc.decision_status || undefined,
        decisionComment: doc.decision_comment || undefined,
        decisionDate: doc.decision_date ? new Date(doc.decision_date) : undefined,
        decidedBy: doc.decided_by || undefined,
        acceptedEventId: doc.accepted_event_id || undefined,
        dispatchingStatus: doc.dispatching_status || undefined,
        approvalStatus: doc.approval_status || undefined,
      };
    });
    
    // Sort by submittedAt descending
    return submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  } catch (error) {
    console.error('Error getting registration submissions:', error);
    throw error;
  }
};

/**
 * Update a form submission
 */
export const updateFormSubmission = async (
  submissionId: string,
  submission: Omit<FormSubmission, 'id' | 'submittedAt'>
): Promise<void> => {
  try {
    // Serialize JSON fields for Supabase storage
    const updateData: any = {
      form_id: submission.formId,
      event_id: submission.eventId,
      event_title: submission.eventTitle,
      user_id: submission.userId,
      participant_user_id: submission.participantUserId || null,
      submitted_by: submission.submittedBy,
      subscription_type: submission.subscriptionType,
      entity_name: submission.entityName || null,
      role: submission.role,
    };
    if (submission.generalInfo !== undefined) {
      updateData.general_info = JSON.stringify(submission.generalInfo);
    }
    if (submission.answers !== undefined) {
      updateData.answers = JSON.stringify(submission.answers);
    }
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', submissionId);
    
    if (error) {
      throw error;
    }

    // Also update answers in dedicated tables if they exist
    if (submission.answers && Object.keys(submission.answers).length > 0) {
      try {
        const form = await getRegistrationForm(submission.formId);
        if (form) {
          const titleLower = form.title.toLowerCase();
          const isSubmissionForm = titleLower.startsWith('sub - ') || titleLower.startsWith('sub-') || 
                                   titleLower.includes('submission') || titleLower.includes('submit');
          
          // Delete old answers first
          const answersTable = isSubmissionForm ? TABLES.SUBMISSIONS_ANSWERS : TABLES.REGISTRATION_FORMS_ANSWERS;
          await supabase
            .from(answersTable)
            .delete()
            .eq('submission_id', submissionId);
          
          // Save new answers
          if (isSubmissionForm) {
            await saveSubmissionAnswers(submissionId, submission.formId, form, submission.answers);
          } else {
            await saveRegistrationFormAnswers(submissionId, submission.formId, form, submission.answers, submission.participantUserId);
          }
        }
      } catch (answerError) {
        // Log error but don't fail the update
        console.error('Error updating answers in dedicated tables:', answerError);
      }
    }
  } catch (error) {
    console.error('Error updating form submission:', error);
    throw error;
  }
};

/**
 * Delete a form submission
 */
export const deleteFormSubmission = async (submissionId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', submissionId);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting form submission:', error);
    throw new Error(error.message || 'Failed to delete form submission');
  }
};

/**
 * Delete multiple form submissions
 */
export const deleteFormSubmissions = async (submissionIds: string[]): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .in('id', submissionIds);
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting form submissions:', error);
    throw new Error(error.message || 'Failed to delete form submissions');
  }
};

/**
 * Update submission decision
 */
export const updateSubmissionDecision = async (
  submissionId: string,
  decisionStatus: DecisionStatus,
  decisionComment: string,
  decidedBy: string,
  acceptedEventId?: string // Event ID for which the submission was accepted
): Promise<void> => {
  try {
    const updateData: any = {
      decision_status: decisionStatus,
      decision_comment: decisionComment || null,
      decision_date: new Date().toISOString(),
      decided_by: decidedBy,
    };
    
    // If accepting, set the accepted_event_id to the submission's event_id
    // If acceptedEventId is provided, use it; otherwise, we'll get it from the submission
    if (decisionStatus === 'accepted') {
      if (acceptedEventId) {
        updateData.accepted_event_id = acceptedEventId;
      } else {
        // Get the submission first to get its event_id
        const { data: submission } = await supabase
          .from(TABLE_NAME)
          .select('event_id')
          .eq('id', submissionId)
          .single();
        
        if (submission) {
          updateData.accepted_event_id = submission.event_id;
        }
      }
    } else {
      // If not accepted, clear the accepted_event_id
      updateData.accepted_event_id = null;
    }
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', submissionId);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating submission decision:', error);
    throw error;
  }
};

/**
 * Search participants from jury_members table by query string
 * Searches in first_name, last_name, email, and affiliation fields
 * Note: Searches all jury members in the database (not filtered by user_id)
 */
export const searchParticipants = async (
  userId: string,
  searchQuery: string
): Promise<FormSubmission[]> => {
  try {
    if (!searchQuery || searchQuery.trim() === '') {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();
    
    // Get all jury members from the database (participants are stored here)
    const { data, error } = await supabase
      .from(TABLES.JURY_MEMBERS)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    // Filter jury members that match the search query
    const matchingMembers = data.filter(doc => {
      const firstName = (doc.first_name || '').toLowerCase();
      const lastName = (doc.last_name || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      const email = (doc.email || '').toLowerCase();
      
      // Deserialize affiliation JSON
      let organization = '';
      try {
        const affiliation = doc.affiliation ? JSON.parse(doc.affiliation as string) : {};
        organization = (
          affiliation.institution || 
          affiliation.university || 
          affiliation.organization || 
          ''
        ).toLowerCase();
      } catch {
        // If parsing fails, ignore
      }
      
      return (
        firstName.includes(query) ||
        lastName.includes(query) ||
        fullName.includes(query) ||
        email.includes(query) ||
        organization.includes(query)
      );
    });
    
    // Convert jury members to FormSubmission format for compatibility
    return matchingMembers.map(doc => {
      // Deserialize JSON fields
      const affiliation = doc.affiliation ? JSON.parse(doc.affiliation as string) : {};
      const researchDomains = doc.research_domains ? JSON.parse(doc.research_domains as string) : [];
      const identifiers = doc.links ? JSON.parse(doc.links as string) : {};
      
      // Map jury member to FormSubmission format
      return {
        id: doc.id,
        formId: '', // Not applicable for jury members
        eventId: '', // Not applicable for jury members
        eventTitle: '', // Not applicable for jury members
        userId: doc.user_id,
        submittedBy: doc.email,
        subscriptionType: 'self' as const,
        role: 'Participant' as const,
        isJuryMember: true,
        juryMemberId: doc.id,
        generalInfo: {
          name: `${doc.first_name} ${doc.last_name}`.trim(),
          email: doc.email,
          phone: doc.phone || undefined,
          organization: affiliation.organization || affiliation.institution || affiliation.university || undefined,
          address: doc.address || undefined,
        },
        answers: {
          // Map additional fields from jury member to answers format
          title: doc.title || undefined,
          gender: doc.gender || undefined,
          nationality: doc.nationality || undefined,
          preferredLanguage: doc.preferred_language || undefined,
          position: affiliation.position || undefined,
          department: affiliation.department || affiliation.faculty || undefined,
          country: affiliation.country || undefined,
          researchDomains: researchDomains.length > 0 ? researchDomains : undefined,
          orcidId: identifiers.orcidId || undefined,
          googleScholar: identifiers.googleScholar || undefined,
          researchGate: identifiers.researchGate || undefined,
        },
        submittedAt: new Date(doc.created_at),
      };
    });
  } catch (error: any) {
    console.error('Error searching participants:', error);
    throw new Error(error.message || 'Failed to search participants');
  }
};