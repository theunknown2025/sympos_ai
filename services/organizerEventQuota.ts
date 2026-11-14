import { supabase, TABLES } from '../supabase';
import {
  getOrganizerPlatformSubscription,
  isFreePlan,
  isSubscriptionAccessAllowed,
  OrganizerPlatformSubscription,
} from './organizerPlatformSubscriptionService';

/** Events an organizer may own during the free trial. */
export const FREE_TRIAL_MAX_EVENTS = 1;

export type EventQuotaSource = 'trial' | 'pro' | 'unrestricted' | 'inactive';

export interface OrganizerEventQuota {
  /** False for accounts with no platform subscription (SuperAdmin, legacy). */
  applies: boolean;
  maxEvents: number;
  usedEvents: number;
  canCreate: boolean;
  source: EventQuotaSource;
}

export class EventQuotaExceededError extends Error {
  readonly code = 'EVENT_QUOTA_EXCEEDED';
  readonly quota: OrganizerEventQuota;

  constructor(quota: OrganizerEventQuota) {
    super('EVENT_QUOTA_EXCEEDED');
    this.name = 'EventQuotaExceededError';
    this.quota = quota;
  }
}

export function isEventQuotaExceededError(err: unknown): err is EventQuotaExceededError {
  return err instanceof EventQuotaExceededError || (
    !!err &&
    typeof err === 'object' &&
    (err as { code?: string }).code === 'EVENT_QUOTA_EXCEEDED'
  );
}

export function isEventQuotaDbError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String((err as { message?: string })?.message || err || '');
  return message.includes('EVENT_QUOTA_EXCEEDED');
}

async function countOwnedEvents(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from(TABLES.EVENTS)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Event slots from the latest approved Pro order.
 * A newer approved pack replaces the previous one (it does not add to it).
 * Editions on an order do not add event slots.
 */
export async function getApprovedProEventAllowance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from(TABLES.ORGANIZER_PRO_ORDERS)
    .select('events_count')
    .eq('organizer_user_id', userId)
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  const raw = Number(data?.[0]?.events_count);
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.floor(raw);
}

function quotaFromSubscription(
  subscription: OrganizerPlatformSubscription | null,
  usedEvents: number,
  proAllowance: number | null
): OrganizerEventQuota {
  if (!subscription) {
    return {
      applies: false,
      maxEvents: Number.POSITIVE_INFINITY,
      usedEvents,
      canCreate: true,
      source: 'unrestricted',
    };
  }

  if (isFreePlan(subscription) && isSubscriptionAccessAllowed(subscription)) {
    return {
      applies: true,
      maxEvents: FREE_TRIAL_MAX_EVENTS,
      usedEvents,
      canCreate: usedEvents < FREE_TRIAL_MAX_EVENTS,
      source: 'trial',
    };
  }

  if (subscription.plan_code === 'pro' && subscription.status === 'active') {
    const maxEvents = proAllowance ?? 1;
    return {
      applies: true,
      maxEvents,
      usedEvents,
      canCreate: usedEvents < maxEvents,
      source: 'pro',
    };
  }

  return {
    applies: true,
    maxEvents: 0,
    usedEvents,
    canCreate: false,
    source: 'inactive',
  };
}

export async function getOrganizerEventQuota(userId: string): Promise<OrganizerEventQuota> {
  const subscription = await getOrganizerPlatformSubscription(userId);
  const usedEvents = await countOwnedEvents(userId);
  const proAllowance =
    subscription?.plan_code === 'pro' && subscription.status === 'active'
      ? await getApprovedProEventAllowance(userId)
      : null;
  return quotaFromSubscription(subscription, usedEvents, proAllowance);
}

export async function assertOrganizerCanCreateEvent(userId: string): Promise<OrganizerEventQuota> {
  const quota = await getOrganizerEventQuota(userId);
  if (quota.applies && !quota.canCreate) {
    throw new EventQuotaExceededError(quota);
  }
  return quota;
}
