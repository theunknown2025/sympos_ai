import { supabase, TABLES } from '../supabase';
import { DispatchSubmission, FormSubmission, EvaluationAnswer, Event, EvaluationForm, RegistrationForm } from '../types';
import { getEventSubmissions } from './registrationSubmissionService';
import { getEvaluationAnswers } from './evaluationAnswerService';
import { getEvaluationForm } from './evaluationFormService';
import { getRegistrationForm } from './registrationFormService';

const FORM_SUBMISSIONS_TABLE = TABLES.FORM_SUBMISSIONS;

export interface DispatchedItem {
  submissionId: string;
  submissionType: 'submission' | 'evaluation';
  eventId: string;
  eventName: string;
  formId: string;
  formTitle: string;
  submission: FormSubmission | EvaluationAnswer;
  dispatchId: string; // ID of the dispatch record
}

/**
 * Get committee member IDs for a jury member (by email)
 */
const getCommitteeMemberIdsForJuryMember = async (juryMemberEmail: string): Promise<string[]> => {
  try {
    console.log('[getCommitteeMemberIdsForJuryMember] Looking up email:', juryMemberEmail);
    const { data, error } = await supabase
      .from(TABLES.COMMITTEE_MEMBERS)
      .select('id, email')
      .eq('email', juryMemberEmail);
    
    if (error) {
      console.error('[getCommitteeMemberIdsForJuryMember] Error:', error);
      throw error;
    }
    
    console.log('[getCommitteeMemberIdsForJuryMember] Found committee members:', data);
    return data?.map(m => m.id) || [];
  } catch (error: any) {
    console.error('[getCommitteeMemberIdsForJuryMember] Error getting committee member IDs:', error);
    return [];
  }
};

/**
 * Get all dispatched items for a participant (jury member)
 * This finds all submissions/evaluations that have been assigned to this participant
 * by matching their email to committee member records
 */
export const getDispatchedItemsForParticipant = async (
  juryMemberEmail: string
): Promise<DispatchedItem[]> => {
  try {
    console.log('[getDispatchedItemsForParticipant] Looking up for email:', juryMemberEmail);
    
    // First, get committee member IDs for this jury member
    const committeeMemberIds = await getCommitteeMemberIdsForJuryMember(juryMemberEmail);
    console.log('[getDispatchedItemsForParticipant] Found committee member IDs:', committeeMemberIds);
    
    if (committeeMemberIds.length === 0) {
      console.log('[getDispatchedItemsForParticipant] No committee member records found');
      return []; // No committee member records found for this jury member
    }
    
    // Get all dispatch records
    const { data: dispatchRecords, error: dispatchError } = await supabase
      .from(TABLES.DISPATCH_SUBMISSIONS)
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (dispatchError) {
      console.error('[getDispatchedItemsForParticipant] Error fetching dispatch records:', dispatchError);
      throw dispatchError;
    }
    
    if (!dispatchRecords || dispatchRecords.length === 0) {
      console.log('[getDispatchedItemsForParticipant] No dispatch records found');
      return [];
    }
    
    console.log('[getDispatchedItemsForParticipant] Found', dispatchRecords.length, 'dispatch records');
    
    const dispatchedItems: DispatchedItem[] = [];
    
    // Process each dispatch record
    for (const dispatchRecord of dispatchRecords) {
      // Parse dispatching JSON
      const dispatching = typeof dispatchRecord.dispatching === 'string'
        ? JSON.parse(dispatchRecord.dispatching)
        : (dispatchRecord.dispatching || {});
      
      console.log('[getDispatchedItemsForParticipant] Processing dispatch:', dispatchRecord.id, 'dispatching:', dispatching);
      
      // Get event info separately
      const { data: eventData, error: eventError } = await supabase
        .from(TABLES.EVENTS)
        .select('id, name')
        .eq('id', dispatchRecord.event_id)
        .single();
      
      if (eventError || !eventData) {
        console.warn('[getDispatchedItemsForParticipant] Event not found:', dispatchRecord.event_id, eventError);
        continue;
      }
      
      // Determine if this is a submission or evaluation based on form type
      let form: EvaluationForm | RegistrationForm | null = null;
      let submissionType: 'submission' | 'evaluation' = 'submission';
      
      // Try to get as evaluation form first
      form = await getEvaluationForm(dispatchRecord.form_id);
      if (form) {
        submissionType = 'evaluation';
        console.log('[getDispatchedItemsForParticipant] Found evaluation form:', form.title);
      } else {
        // Try as registration form
        form = await getRegistrationForm(dispatchRecord.form_id);
        if (form) {
          submissionType = 'submission';
          console.log('[getDispatchedItemsForParticipant] Found registration form:', form.title);
        } else {
          console.warn('[getDispatchedItemsForParticipant] Form not found:', dispatchRecord.form_id);
          continue; // Form not found, skip
        }
      }
      
      // Check if this participant is assigned to any submission in this dispatch
      for (const [submissionId, memberIds] of Object.entries(dispatching)) {
        const memberIdsArray = Array.isArray(memberIds) ? memberIds : [memberIds];
        
        console.log('[getDispatchedItemsForParticipant] Checking submission:', submissionId, 'assigned to:', memberIdsArray);
        console.log('[getDispatchedItemsForParticipant] Participant committee member IDs:', committeeMemberIds);
        
        // Check if any of the participant's committee member IDs are in the assigned list
        const isAssigned = committeeMemberIds.some(id => memberIdsArray.includes(id));
        
        console.log('[getDispatchedItemsForParticipant] Is assigned?', isAssigned);
        
        if (isAssigned) {
          // This participant is assigned to this submission
          // Get the submission/evaluation answer
          let submission: FormSubmission | EvaluationAnswer | null = null;
          
          if (submissionType === 'evaluation') {
            const answers = await getEvaluationAnswers(dispatchRecord.form_id);
            submission = answers.find(a => a.id === submissionId) || null;
          } else {
            // For submissions, get directly by ID (more reliable than event-based lookup)
            try {
              const { data: submissionData, error: subError } = await supabase
                .from(FORM_SUBMISSIONS_TABLE)
                .select('*')
                .eq('id', submissionId)
                .single();
              
              if (!subError && submissionData) {
                // Deserialize JSON fields
                const generalInfo = typeof submissionData.general_info === 'string' 
                  ? JSON.parse(submissionData.general_info) 
                  : (submissionData.general_info || {});
                const answers = typeof submissionData.answers === 'string' 
                  ? JSON.parse(submissionData.answers) 
                  : (submissionData.answers || {});
                
                submission = {
                  id: submissionData.id,
                  formId: submissionData.form_id,
                  eventId: submissionData.event_id,
                  eventTitle: submissionData.event_title,
                  userId: submissionData.user_id,
                  submittedBy: submissionData.submitted_by,
                  subscriptionType: (submissionData.subscription_type as 'self' | 'entity') || 'self',
                  entityName: submissionData.entity_name || undefined,
                  role: (submissionData.role as 'Organizer' | 'Participant') || 'Participant',
                  generalInfo: generalInfo,
                  answers: answers,
                  submittedAt: new Date(submissionData.created_at),
                  decisionStatus: submissionData.decision_status || undefined,
                  decisionComment: submissionData.decision_comment || undefined,
                  decisionDate: submissionData.decision_date ? new Date(submissionData.decision_date) : undefined,
                  decidedBy: submissionData.decided_by || undefined,
                  acceptedEventId: submissionData.accepted_event_id || undefined,
                };
              } else {
                // Fall back to event-based lookup
                const submissions = await getEventSubmissions(eventData.id);
                submission = submissions.find(s => s.id === submissionId) || null;
              }
            } catch (err) {
              // Fall back to event-based lookup
              const submissions = await getEventSubmissions(eventData.id);
              submission = submissions.find(s => s.id === submissionId) || null;
            }
          }
          
          if (submission) {
            console.log('[getDispatchedItemsForParticipant] Adding dispatched item:', submissionId);
            dispatchedItems.push({
              submissionId: submissionId,
              submissionType: submissionType,
              eventId: eventData.id,
              eventName: eventData.name,
              formId: dispatchRecord.form_id,
              formTitle: form.title,
              submission: submission,
              dispatchId: dispatchRecord.id,
            });
          } else {
            console.warn('[getDispatchedItemsForParticipant] Submission not found:', submissionId, 'type:', submissionType);
          }
        }
      }
    }
    
    console.log('[getDispatchedItemsForParticipant] Total dispatched items found:', dispatchedItems.length);
    return dispatchedItems;
  } catch (error: any) {
    console.error('Error getting dispatched items for participant:', error);
    throw new Error(error.message || 'Failed to get dispatched items');
  }
};

/**
 * Get dispatched items for a participant grouped by event
 */
export const getDispatchedItemsByEvent = async (
  juryMemberEmail: string
): Promise<Record<string, DispatchedItem[]>> => {
  const items = await getDispatchedItemsForParticipant(juryMemberEmail);
  
  const grouped: Record<string, DispatchedItem[]> = {};
  
  for (const item of items) {
    if (!grouped[item.eventId]) {
      grouped[item.eventId] = [];
    }
    grouped[item.eventId].push(item);
  }
  
  return grouped;
};
