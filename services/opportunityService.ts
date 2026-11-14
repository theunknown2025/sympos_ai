import { supabase, TABLES } from '../supabase';
import type {
  Opportunity,
  OpportunityAttachedFile,
  OpportunityBanner,
  OpportunityComplementaryCriterion,
  OpportunityKind,
  OpportunityLocationType,
  OpportunityPublishStatus,
  OpportunityStep,
} from '../types';

const TABLE = TABLES.OPPORTUNITIES;

const getOrganizerCampusId = async (organizerUserId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from(TABLES.ORGANIZER_MEMBERSHIPS)
    .select('campus_id')
    .eq('organizer_user_id', organizerUserId)
    .maybeSingle();
  if (error) throw new Error(error.message || 'Failed to fetch organizer campus');
  return data?.campus_id ?? null;
};

function parseJsonObject<T>(value: unknown): T | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as T;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function parseJsonArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function mapDbRowToOpportunity(row: Record<string, unknown>): Opportunity {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    campusId: (row.campus_id as string) || undefined,
    kind: row.kind as OpportunityKind,
    title: row.title as string,
    banner: parseJsonObject<OpportunityBanner>(row.banner),
    attachedFiles: parseJsonArray<OpportunityAttachedFile>(row.attached_files),
    deadline: row.deadline ? String(row.deadline) : undefined,
    place: (row.place as string) || undefined,
    locationType: (row.location_type as OpportunityLocationType) || 'in_house',
    complementaryCriteria: parseJsonArray<OpportunityComplementaryCriterion>(
      row.complementary_criteria
    ),
    description: (row.description as string) || undefined,
    steps: parseJsonArray<OpportunityStep>(row.steps),
    stepsSectionTitle: (row.steps_section_title as string) || undefined,
    paymentFormId: (row.payment_form_id as string) || undefined,
    paymentStepId: (row.payment_step_id as string) || undefined,
    publishStatus: (row.publish_status as OpportunityPublishStatus) || 'Draft',
    publicSlug: (row.public_slug as string) || undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function slugifyTitle(title: string): string {
  const base = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'opportunity';
}

async function ensureUniquePublicSlug(
  baseSlug: string,
  excludeOpportunityId?: string
): Promise<string> {
  let candidate = baseSlug;
  let suffix = 0;
  for (;;) {
    let query = supabase.from(TABLE).select('id').eq('public_slug', candidate);
    if (excludeOpportunityId) {
      query = query.neq('id', excludeOpportunityId);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message || 'Failed to validate public slug');
    if (!data) return candidate;
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

export function getOpportunityPublicUrl(slug: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/o/${slug}`;
  }
  return `/o/${slug}`;
}

export const getPublishedOpportunityBySlug = async (
  slug: string
): Promise<Opportunity | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('public_slug', slug)
    .eq('publish_status', 'Published')
    .maybeSingle();
  if (error) throw new Error(error.message || 'Failed to load opportunity');
  return data ? mapDbRowToOpportunity(data) : null;
};

export const publishOpportunityPublicly = async (
  opportunityId: string,
  userId: string
): Promise<{ slug: string; publicUrl: string }> => {
  const existing = await getOpportunityById(opportunityId);
  if (!existing || existing.userId !== userId) {
    throw new Error('Opportunity not found');
  }

  const slug =
    existing.publicSlug ||
    (await ensureUniquePublicSlug(slugifyTitle(existing.title), opportunityId));

  const { error } = await supabase
    .from(TABLE)
    .update({
      publish_status: 'Published',
      public_slug: slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', opportunityId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message || 'Failed to publish opportunity');
  return { slug, publicUrl: getOpportunityPublicUrl(slug) };
};

function opportunityToDb(
  opp: Partial<Opportunity> & { title: string; kind: OpportunityKind }
): Record<string, unknown> {
  return {
    kind: opp.kind,
    title: opp.title.trim(),
    banner: opp.banner ? JSON.stringify(opp.banner) : null,
    attached_files: JSON.stringify(opp.attachedFiles ?? []),
    deadline: opp.deadline ?? null,
    place: opp.place ?? null,
    location_type: opp.locationType ?? 'in_house',
    complementary_criteria: JSON.stringify(opp.complementaryCriteria ?? []),
    description: opp.description ?? null,
    steps: JSON.stringify(opp.steps ?? []),
    steps_section_title: opp.stepsSectionTitle?.trim() || null,
    payment_form_id: opp.paymentFormId ?? null,
    payment_step_id: opp.paymentStepId ?? null,
    publish_status: opp.publishStatus ?? 'Draft',
  };
}

export const saveOpportunity = async (
  userId: string,
  data: Omit<Opportunity, 'id' | 'userId' | 'campusId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const insertData = {
    user_id: userId,
    campus_id: await getOrganizerCampusId(userId),
    ...opportunityToDb(data),
  };
  const { data: row, error } = await supabase.from(TABLE).insert(insertData).select('id').single();
  if (error) throw new Error(error.message || 'Failed to save opportunity');
  return row.id;
};

export const updateOpportunity = async (
  opportunityId: string,
  userId: string,
  data: Partial<Omit<Opportunity, 'id' | 'userId' | 'campusId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.kind !== undefined) patch.kind = data.kind;
  if (data.title !== undefined) patch.title = data.title.trim();
  if (data.banner !== undefined) patch.banner = data.banner ? JSON.stringify(data.banner) : null;
  if (data.attachedFiles !== undefined) {
    patch.attached_files = JSON.stringify(data.attachedFiles);
  }
  if (data.deadline !== undefined) patch.deadline = data.deadline || null;
  if (data.place !== undefined) patch.place = data.place;
  if (data.locationType !== undefined) patch.location_type = data.locationType;
  if (data.complementaryCriteria !== undefined) {
    patch.complementary_criteria = JSON.stringify(data.complementaryCriteria);
  }
  if (data.description !== undefined) patch.description = data.description;
  if (data.steps !== undefined) patch.steps = JSON.stringify(data.steps);
  if (data.stepsSectionTitle !== undefined) {
    patch.steps_section_title = data.stepsSectionTitle?.trim() || null;
  }
  if (data.paymentFormId !== undefined) patch.payment_form_id = data.paymentFormId || null;
  if (data.paymentStepId !== undefined) patch.payment_step_id = data.paymentStepId || null;
  if (data.publishStatus !== undefined) patch.publish_status = data.publishStatus;
  if (data.publicSlug !== undefined) patch.public_slug = data.publicSlug || null;

  const { error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', opportunityId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message || 'Failed to update opportunity');
};

export const getOpportunityById = async (id: string): Promise<Opportunity | null> => {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message || 'Failed to load opportunity');
  return data ? mapDbRowToOpportunity(data) : null;
};

export const getOrganizerOpportunities = async (userId: string): Promise<Opportunity[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message || 'Failed to list opportunities');
  return (data || []).map(mapDbRowToOpportunity);
};

export const deleteOpportunity = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id).eq('user_id', userId);
  if (error) throw new Error(error.message || 'Failed to delete opportunity');
};

export const getOpportunityDashboardStats = async (
  userId: string
): Promise<{
  total: number;
  published: number;
  inProgressApplications: number;
  rejectedApplications: number;
}> => {
  const opps = await getOrganizerOpportunities(userId);
  const oppIds = opps.map((o) => o.id);
  let inProgressApplications = 0;
  let rejectedApplications = 0;
  if (oppIds.length > 0) {
    const { data: apps, error } = await supabase
      .from(TABLES.OPPORTUNITY_APPLICATIONS)
      .select('status')
      .in('opportunity_id', oppIds);
    if (error) throw new Error(error.message || 'Failed to load application stats');
    for (const a of apps || []) {
      if (a.status === 'in_progress') inProgressApplications++;
      if (a.status === 'rejected') rejectedApplications++;
    }
  }
  return {
    total: opps.length,
    published: opps.filter((o) => o.publishStatus === 'Published').length,
    inProgressApplications,
    rejectedApplications,
  };
};

export function isOpportunityDeadlinePassed(opp: Opportunity): boolean {
  if (!opp.deadline) return false;
  return new Date(opp.deadline).getTime() < Date.now();
}

export function sortedOpportunitySteps(opp: Opportunity): OpportunityStep[] {
  return [...opp.steps].sort((a, b) => a.order - b.order);
}

export function getFormIdForOpportunityStep(opp: Opportunity, stepIndex: number): string | undefined {
  const steps = sortedOpportunitySteps(opp);
  const step = steps[stepIndex];
  if (!step) return undefined;
  if (opp.paymentStepId && step.id === opp.paymentStepId && opp.paymentFormId) {
    return opp.paymentFormId;
  }
  return step.registrationFormId;
}

export interface PublishedOpportunitySearchFilters {
  query?: string;
  kind?: OpportunityKind;
  locationType?: OpportunityLocationType;
  place?: string;
}

export interface PublishedOpportunitySearchResult {
  opportunities: Opportunity[];
  total: number;
}

function publishedOpportunitiesBaseQuery() {
  return supabase
    .from(TABLE)
    .select('*', { count: 'exact' })
    .eq('publish_status', 'Published')
    .not('public_slug', 'is', null);
}

function applyPublishedSearchFilters(
  query: ReturnType<typeof publishedOpportunitiesBaseQuery>,
  filters: PublishedOpportunitySearchFilters
) {
  let q = query;
  const term = filters.query?.trim().replace(/,/g, ' ');
  if (term) {
    const pattern = `%${term}%`;
    q = q.or(`title.ilike.${pattern},place.ilike.${pattern},description.ilike.${pattern}`);
  }
  if (filters.kind) q = q.eq('kind', filters.kind);
  if (filters.locationType) q = q.eq('location_type', filters.locationType);
  if (filters.place?.trim()) {
    q = q.ilike('place', `%${filters.place.trim()}%`);
  }
  return q;
}

export const getLatestPublishedOpportunities = async (
  limit = 5
): Promise<Opportunity[]> => {
  const { data, error } = await publishedOpportunitiesBaseQuery()
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message || 'Failed to load opportunities');
  return (data || []).map(mapDbRowToOpportunity);
};

export const getLatestPublishedOpportunitiesByKind = async (
  kind: OpportunityKind,
  limit = 6
): Promise<Opportunity[]> => {
  const { data, error } = await publishedOpportunitiesBaseQuery()
    .eq('kind', kind)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message || 'Failed to load opportunities');
  return (data || []).map(mapDbRowToOpportunity);
};

export interface OpportunityNeighborLink {
  slug: string;
  title: string;
}

export const getPublishedOpportunityNeighborsByKind = async (
  opportunityId: string,
  kind: OpportunityKind
): Promise<{ prev: OpportunityNeighborLink | null; next: OpportunityNeighborLink | null }> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, public_slug, title')
    .eq('publish_status', 'Published')
    .not('public_slug', 'is', null)
    .eq('kind', kind)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message || 'Failed to load related opportunities');

  const list = (data || [])
    .filter((row) => row.public_slug)
    .map((row) => ({
      id: row.id as string,
      slug: row.public_slug as string,
      title: row.title as string,
    }));

  const index = list.findIndex((o) => o.id === opportunityId);
  if (index < 0) return { prev: null, next: null };

  const prev = index > 0 ? list[index - 1] : null;
  const next = index < list.length - 1 ? list[index + 1] : null;

  return {
    prev: prev ? { slug: prev.slug, title: prev.title } : null,
    next: next ? { slug: next.slug, title: next.title } : null,
  };
};

export const searchPublishedOpportunities = async (
  filters: PublishedOpportunitySearchFilters,
  page: number,
  pageSize: number
): Promise<PublishedOpportunitySearchResult> => {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, Math.min(50, pageSize));
  const from = (safePage - 1) * safeSize;
  const to = from + safeSize - 1;

  const { data, error, count } = await applyPublishedSearchFilters(
    publishedOpportunitiesBaseQuery(),
    filters
  )
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message || 'Failed to search opportunities');
  return {
    opportunities: (data || []).map(mapDbRowToOpportunity),
    total: count ?? 0,
  };
};
