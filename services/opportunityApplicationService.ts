import { supabase, TABLES } from '../supabase';
import type { FormSubmission, Opportunity, OpportunityApplication } from '../types';
import { mapDbRowToOpportunity } from './opportunityService';
import { mapDbRowToFormSubmission } from './registrationSubmissionService';

const APP_TABLE = TABLES.OPPORTUNITY_APPLICATIONS;
const FS_TABLE = TABLES.FORM_SUBMISSIONS;

function mapDbRowToApplication(row: Record<string, unknown>): OpportunityApplication {
  return {
    id: row.id as string,
    opportunityId: row.opportunity_id as string,
    participantUserId: row.participant_user_id as string,
    currentStepIndex: Number(row.current_step_index ?? 0),
    status: row.status as OpportunityApplication['status'],
    rejectedAtStepIndex:
      row.rejected_at_step_index != null ? Number(row.rejected_at_step_index) : undefined,
    decisionComment: (row.decision_comment as string) || undefined,
    decidedBy: (row.decided_by as string) || undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    opportunity: row.opportunities
      ? mapDbRowToOpportunity(
          (Array.isArray(row.opportunities) ? row.opportunities[0] : row.opportunities) as Record<
            string,
            unknown
          >
        )
      : undefined,
  };
}

export const createOpportunityApplication = async (
  opportunityId: string,
  participantUserId: string
): Promise<string> => {
  const { data, error } = await supabase
    .from(APP_TABLE)
    .insert({
      opportunity_id: opportunityId,
      participant_user_id: participantUserId,
      current_step_index: 0,
      status: 'in_progress',
    })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already applied to this opportunity');
    }
    throw new Error(error.message || 'Failed to create application');
  }
  return data.id;
};

export const getApplicationById = async (id: string): Promise<OpportunityApplication | null> => {
  const { data, error } = await supabase
    .from(APP_TABLE)
    .select('*, opportunities(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message || 'Failed to load application');
  return data ? mapDbRowToApplication(data) : null;
};

export const getParticipantApplicationForOpportunity = async (
  opportunityId: string,
  participantUserId: string
): Promise<OpportunityApplication | null> => {
  const { data, error } = await supabase
    .from(APP_TABLE)
    .select('*, opportunities(*)')
    .eq('opportunity_id', opportunityId)
    .eq('participant_user_id', participantUserId)
    .maybeSingle();
  if (error) throw new Error(error.message || 'Failed to load application');
  return data ? mapDbRowToApplication(data) : null;
};

export const getParticipantApplications = async (
  participantUserId: string
): Promise<OpportunityApplication[]> => {
  const { data, error } = await supabase
    .from(APP_TABLE)
    .select('*, opportunities(*)')
    .eq('participant_user_id', participantUserId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message || 'Failed to list applications');
  return (data || []).map(mapDbRowToApplication);
};

export const getApplicationsForOrganizerOpportunities = async (
  organizerUserId: string
): Promise<{ opportunity: Opportunity; applications: OpportunityApplication[] }[]> => {
  const { data: opps, error: oppErr } = await supabase
    .from(TABLES.OPPORTUNITIES)
    .select('*')
    .eq('user_id', organizerUserId)
    .order('title', { ascending: true });
  if (oppErr) throw new Error(oppErr.message || 'Failed to load opportunities');

  const result: { opportunity: Opportunity; applications: OpportunityApplication[] }[] = [];
  for (const row of opps || []) {
    const opportunity = mapDbRowToOpportunity(row);
    const { data: apps, error: appErr } = await supabase
      .from(APP_TABLE)
      .select('*')
      .eq('opportunity_id', opportunity.id)
      .order('created_at', { ascending: false });
    if (appErr) throw new Error(appErr.message || 'Failed to load applications');
    result.push({
      opportunity,
      applications: (apps || []).map((a) => mapDbRowToApplication(a)),
    });
  }
  return result;
};

export const getSubmissionsForApplication = async (
  applicationId: string
): Promise<FormSubmission[]> => {
  const { data, error } = await supabase
    .from(FS_TABLE)
    .select('*')
    .eq('opportunity_application_id', applicationId)
    .order('opportunity_step_index', { ascending: true });
  if (error) throw new Error(error.message || 'Failed to load step submissions');
  return (data || []).map((row) => mapDbRowToFormSubmission(row));
};

export const hasSubmissionForStep = async (
  applicationId: string,
  stepIndex: number
): Promise<boolean> => {
  const { data, error } = await supabase
    .from(FS_TABLE)
    .select('id')
    .eq('opportunity_application_id', applicationId)
    .eq('opportunity_step_index', stepIndex)
    .maybeSingle();
  if (error) throw new Error(error.message || 'Failed to check submission');
  return !!data;
};

export const advanceOpportunityApplication = async (
  applicationId: string,
  organizerUserId: string,
  opportunity: Opportunity
): Promise<void> => {
  const app = await getApplicationById(applicationId);
  if (!app || app.status !== 'in_progress') {
    throw new Error('Application is not in progress');
  }
  const hasCurrent = await hasSubmissionForStep(applicationId, app.currentStepIndex);
  if (!hasCurrent) {
    throw new Error('Participant has not submitted the current step yet');
  }
  const steps = [...opportunity.steps].sort((a, b) => a.order - b.order);
  const nextIndex = app.currentStepIndex + 1;
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (nextIndex >= steps.length) {
    patch.status = 'completed';
  } else {
    patch.current_step_index = nextIndex;
  }
  const { error } = await supabase
    .from(APP_TABLE)
    .update(patch)
    .eq('id', applicationId);
  if (error) throw new Error(error.message || 'Failed to advance application');
  void organizerUserId;
};

export const rejectOpportunityApplication = async (
  applicationId: string,
  organizerUserId: string,
  comment?: string
): Promise<void> => {
  const app = await getApplicationById(applicationId);
  if (!app) throw new Error('Application not found');
  const { error } = await supabase
    .from(APP_TABLE)
    .update({
      status: 'rejected',
      rejected_at_step_index: app.currentStepIndex,
      decision_comment: comment || null,
      decided_by: organizerUserId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId);
  if (error) throw new Error(error.message || 'Failed to reject application');
};

export const countApplicationsByOpportunity = async (
  opportunityIds: string[]
): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();
  if (!opportunityIds.length) return counts;
  const { data, error } = await supabase
    .from(APP_TABLE)
    .select('opportunity_id')
    .in('opportunity_id', opportunityIds);
  if (error) throw new Error(error.message || 'Failed to count applications');
  for (const row of data || []) {
    const id = row.opportunity_id as string;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return counts;
};
