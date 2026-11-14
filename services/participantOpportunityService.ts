import { supabase, TABLES } from '../supabase';
import type { Opportunity } from '../types';
import { mapDbRowToOpportunity } from './opportunityService';

export const getPublishedOpportunities = async (): Promise<Opportunity[]> => {
  const { data, error } = await supabase
    .from(TABLES.OPPORTUNITIES)
    .select('*')
    .in('publish_status', ['Published', 'Closed'])
    .order('deadline', { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message || 'Failed to load opportunities');
  return (data || []).map(mapDbRowToOpportunity);
};

export const saveOpportunityForParticipant = async (
  userId: string,
  opportunityId: string
): Promise<string> => {
  const { data, error } = await supabase
    .from(TABLES.PARTICIPANT_SAVED_OPPORTUNITIES)
    .insert({ user_id: userId, opportunity_id: opportunityId })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from(TABLES.PARTICIPANT_SAVED_OPPORTUNITIES)
        .select('id')
        .eq('user_id', userId)
        .eq('opportunity_id', opportunityId)
        .single();
      return existing?.id || '';
    }
    throw new Error(error.message || 'Failed to save opportunity');
  }
  return data.id;
};

export const removeSavedOpportunity = async (
  userId: string,
  opportunityId: string
): Promise<void> => {
  const { error } = await supabase
    .from(TABLES.PARTICIPANT_SAVED_OPPORTUNITIES)
    .delete()
    .eq('user_id', userId)
    .eq('opportunity_id', opportunityId);
  if (error) throw new Error(error.message || 'Failed to remove saved opportunity');
};

export const getSavedOpportunities = async (userId: string): Promise<Opportunity[]> => {
  const { data, error } = await supabase
    .from(TABLES.PARTICIPANT_SAVED_OPPORTUNITIES)
    .select(`opportunity_id, opportunities (*)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || 'Failed to load saved opportunities');

  const result: Opportunity[] = [];
  for (const item of data || []) {
    const raw = item.opportunities;
    const row = Array.isArray(raw) ? raw[0] : raw;
    if (!row) continue;
    const opp = mapDbRowToOpportunity(row as Record<string, unknown>);
    if (opp.publishStatus === 'Published' || opp.publishStatus === 'Closed') {
      result.push(opp);
    }
  }
  return result;
};

export const isOpportunitySaved = async (
  userId: string,
  opportunityId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from(TABLES.PARTICIPANT_SAVED_OPPORTUNITIES)
    .select('id')
    .eq('user_id', userId)
    .eq('opportunity_id', opportunityId)
    .maybeSingle();
  if (error) return false;
  return !!data;
};
