import { supabase, TABLES } from '../supabase';
import type { EventOrganizerPartner } from '../types';

const TABLE_NAME = TABLES.EVENT_ORGANIZER_PARTNERSHIPS;

export interface OrganizerPartnerSearchResult {
  userId: string;
  /** Primary label: organization or contact name from profile */
  entityName: string;
  profileName?: string;
  entityLogo?: string;
  representativeFullName?: string;
  representativeEmail?: string;
  entityEmail?: string;
  primaryEmail?: string;
  entityCity?: string;
  entityCountry?: string;
}

const PROFILE_SEARCH_SELECT =
  'user_id, entity_name, entity_logo, representative_full_name, representative_email, entity_email, entity_city, entity_country';

const PROFILE_SEARCH_FIELDS = [
  'entity_name',
  'representative_full_name',
  'entity_email',
  'representative_email',
] as const;

const mapProfileRowToSearchResult = (row: Record<string, unknown>): OrganizerPartnerSearchResult | null => {
  const userId = row.user_id as string;
  if (!userId) return null;

  const entityName = ((row.entity_name as string) || '').trim();
  const representativeFullName = ((row.representative_full_name as string) || '').trim();
  const entityEmail = ((row.entity_email as string) || '').trim();
  const representativeEmail = ((row.representative_email as string) || '').trim();
  const profileName = entityName || representativeFullName;

  if (!profileName && !entityEmail && !representativeEmail) {
    return null;
  }

  return {
    userId,
    entityName: profileName || representativeEmail || entityEmail || 'Organizer',
    profileName: profileName || undefined,
    entityLogo: (row.entity_logo as string) || undefined,
    representativeFullName: representativeFullName || undefined,
    representativeEmail: representativeEmail || undefined,
    entityEmail: entityEmail || undefined,
    primaryEmail: representativeEmail || entityEmail || undefined,
    entityCity: (row.entity_city as string) || undefined,
    entityCountry: (row.entity_country as string) || undefined,
  };
};

/**
 * Search organizer profiles by profile name or email.
 */
export const searchOrganizersForPartnership = async (
  query: string,
  excludeUserId: string
): Promise<OrganizerPartnerSearchResult[]> => {
  const trimmed = query.trim();
  if (!trimmed || !excludeUserId) {
    return [];
  }

  const pattern = `%${trimmed}%`;

  const responses = await Promise.all(
    PROFILE_SEARCH_FIELDS.map((field) =>
      supabase
        .from(TABLES.ORGANIZER_PROFILES)
        .select(PROFILE_SEARCH_SELECT)
        .neq('user_id', excludeUserId)
        .ilike(field, pattern)
        .limit(15)
    )
  );

  for (const res of responses) {
    if (res.error) {
      throw new Error(res.error.message || 'Failed to search organizers');
    }
  }

  const seen = new Set<string>();
  const results: OrganizerPartnerSearchResult[] = [];

  for (const res of responses) {
    for (const row of res.data || []) {
      const mapped = mapProfileRowToSearchResult(row as Record<string, unknown>);
      if (!mapped || seen.has(mapped.userId)) continue;
      seen.add(mapped.userId);
      results.push(mapped);
      if (results.length >= 12) break;
    }
    if (results.length >= 12) break;
  }

  return results;
};

export const getEventOrganizerPartners = async (eventId: string): Promise<EventOrganizerPartner[]> => {
  if (!eventId) return [];

  const { data: partnerships, error } = await supabase
    .from(TABLE_NAME)
    .select('id, partner_user_id, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to load event partners');
  }

  if (!partnerships?.length) {
    return [];
  }

  const partnerUserIds = partnerships.map((p) => p.partner_user_id as string);

  const { data: profiles, error: profileErr } = await supabase
    .from(TABLES.ORGANIZER_PROFILES)
    .select('user_id, entity_name, entity_logo, representative_full_name, representative_email, entity_email')
    .in('user_id', partnerUserIds);

  if (profileErr) {
    throw new Error(profileErr.message || 'Failed to load partner profiles');
  }

  const profileByUserId = new Map(
    (profiles || []).map((p) => [p.user_id as string, p])
  );

  return partnerships.map((row) => {
    const profile = profileByUserId.get(row.partner_user_id as string);
    const entityName = (profile?.entity_name as string) || '';
    const representativeFullName = (profile?.representative_full_name as string) || '';
    const representativeEmail = (profile?.representative_email as string) || '';
    const entityEmail = (profile?.entity_email as string) || '';
    return {
      id: row.id as string,
      userId: row.partner_user_id as string,
      displayName:
        entityName ||
        representativeFullName ||
        representativeEmail ||
        entityEmail ||
        'Organizer',
      entityLogo: (profile?.entity_logo as string) || undefined,
      representativeEmail: representativeEmail || entityEmail || undefined,
      createdAt: new Date(row.created_at as string),
    };
  });
};

/**
 * Replace the partner list for an event (owner or partner with manage rights).
 */
export const setEventOrganizerPartners = async (
  eventId: string,
  partnerUserIds: string[],
  actorUserId: string
): Promise<void> => {
  if (!eventId || !actorUserId) {
    throw new Error('Event ID and actor are required');
  }

  const uniquePartnerIds = Array.from(
    new Set(partnerUserIds.filter((id) => id && id !== actorUserId))
  );

  const { data: existing, error: existingErr } = await supabase
    .from(TABLE_NAME)
    .select('id, partner_user_id')
    .eq('event_id', eventId);

  if (existingErr) {
    throw new Error(existingErr.message || 'Failed to read existing partnerships');
  }

  const existingIds = new Set((existing || []).map((r) => r.partner_user_id as string));
  const targetIds = new Set(uniquePartnerIds);

  const toRemove = (existing || []).filter((r) => !targetIds.has(r.partner_user_id as string));
  const toAdd = uniquePartnerIds.filter((id) => !existingIds.has(id));

  if (toRemove.length > 0) {
    const { error: deleteErr } = await supabase
      .from(TABLE_NAME)
      .delete()
      .in(
        'id',
        toRemove.map((r) => r.id as string)
      );

    if (deleteErr) {
      throw new Error(deleteErr.message || 'Failed to remove partners');
    }
  }

  if (toAdd.length > 0) {
    const { error: insertErr } = await supabase.from(TABLE_NAME).insert(
      toAdd.map((partnerUserId) => ({
        event_id: eventId,
        partner_user_id: partnerUserId,
        created_by: actorUserId,
      }))
    );

    if (insertErr) {
      throw new Error(insertErr.message || 'Failed to add partners');
    }
  }
};

export const isEventOrganizerPartner = async (
  eventId: string,
  userId: string
): Promise<boolean> => {
  if (!eventId || !userId) return false;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id')
    .eq('event_id', eventId)
    .eq('partner_user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to check partnership');
  }

  return !!data;
};
