import { supabase, TABLES } from '../supabase';

export const FREE_TRIAL_DAYS = 15;

export type PlatformPlanCode = 'none' | 'free' | 'pro';
export type PlatformSubscriptionStatus =
  | 'unpaid'
  | 'trial'
  | 'active'
  | 'expired'
  | 'pending_payment'
  | 'suspended';

export interface OrganizerPlatformSubscription {
  organizer_user_id: string;
  plan_code: PlatformPlanCode;
  status: PlatformSubscriptionStatus;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PlatformOffer {
  id: PlatformPlanCode;
  name: string;
  priceLabel: string;
  periodLabel: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export const PLATFORM_OFFERS: PlatformOffer[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0',
    periodLabel: '15 days',
    description: 'Full platform access for 15 days. Upgrade anytime before the trial ends.',
    features: [
      '15-day full access',
      'Create and manage 1 event',
      'Registrations & submissions',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Start free trial',
  },
  {
    id: 'pro',
    name: 'Pro',
    priceLabel: 'Custom',
    periodLabel: 'Monthly',
    description: 'Unlimited organizer workspace with priority support and advanced tools.',
    features: [
      'Event slots included in your pack',
      'Full platform access',
      'Priority support',
      'Advanced analytics & reporting',
      'Certificate generation',
      'Custom branding',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
];

function daysRemainingUntil(isoDate: string | null | undefined): number {
  if (!isoDate) return 0;
  const end = new Date(isoDate).getTime();
  if (Number.isNaN(end)) return 0;
  const ms = end - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** True when the organizer is on the Free plan (15-day trial). */
export function isFreePlan(sub: OrganizerPlatformSubscription | null): boolean {
  return !!sub && sub.plan_code === 'free';
}

/**
 * Days left for a Free subscription.
 * Checks plan type first, then trial / period end date.
 */
export function getTrialDaysRemaining(sub: OrganizerPlatformSubscription | null): number {
  if (!isFreePlan(sub)) return 0;
  const endAt = sub!.trial_ends_at || sub!.current_period_end;
  return daysRemainingUntil(endAt);
}

/** Show header countdown only for an active Free trial with days remaining. */
export function shouldShowFreeTrialHeader(sub: OrganizerPlatformSubscription | null): boolean {
  if (!isFreePlan(sub)) return false;
  if (
    sub!.status === 'expired' ||
    sub!.status === 'unpaid' ||
    sub!.status === 'pending_payment' ||
    sub!.status === 'suspended'
  ) {
    return false;
  }
  // Free plan with trial or active status and time left
  if (sub!.status !== 'trial' && sub!.status !== 'active') return false;
  return getTrialDaysRemaining(sub) > 0;
}

export function isSubscriptionAccessAllowed(sub: OrganizerPlatformSubscription | null): boolean {
  if (!sub) return false;
  if (sub.status === 'active' && sub.plan_code === 'pro') return true;
  if (isFreePlan(sub) && (sub.status === 'trial' || sub.status === 'active')) {
    return getTrialDaysRemaining(sub) > 0;
  }
  if (sub.status === 'active') return true;
  return false;
}

export function needsPackageSelection(sub: OrganizerPlatformSubscription | null): boolean {
  if (!sub) return true;
  if (
    sub.status === 'unpaid' ||
    sub.status === 'expired' ||
    sub.status === 'suspended' ||
    sub.status === 'pending_payment'
  ) {
    return true;
  }
  if (isFreePlan(sub) && getTrialDaysRemaining(sub) <= 0) return true;
  return false;
}

/** Pro payment submitted — account locked until Super Admin approves. */
export function isProPaymentUnderReview(sub: OrganizerPlatformSubscription | null): boolean {
  if (!sub || sub.plan_code !== 'pro') return false;
  return sub.status === 'suspended' || sub.status === 'pending_payment';
}

/** Refresh expired trials in-memory (and optionally persist). */
export async function syncExpiredTrial(
  sub: OrganizerPlatformSubscription
): Promise<OrganizerPlatformSubscription> {
  if (sub.status !== 'trial' || !sub.trial_ends_at) return sub;
  if (getTrialDaysRemaining(sub) > 0) return sub;

  const updated: Partial<OrganizerPlatformSubscription> = {
    status: 'expired',
    plan_code: sub.plan_code === 'free' ? 'free' : sub.plan_code,
  };

  const { data, error } = await supabase
    .from(TABLES.ORGANIZER_PLATFORM_SUBSCRIPTIONS)
    .update(updated)
    .eq('organizer_user_id', sub.organizer_user_id)
    .select()
    .maybeSingle();

  if (error || !data) {
    return { ...sub, status: 'expired' };
  }
  return data as OrganizerPlatformSubscription;
}

export async function getOrganizerPlatformSubscription(
  organizerUserId: string
): Promise<OrganizerPlatformSubscription | null> {
  const { data, error } = await supabase
    .from(TABLES.ORGANIZER_PLATFORM_SUBSCRIPTIONS)
    .select('*')
    .eq('organizer_user_id', organizerUserId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load platform subscription:', error);
    throw error;
  }

  if (!data) return null;
  return syncExpiredTrial(data as OrganizerPlatformSubscription);
}

export async function startFreeTrial(
  organizerUserId: string
): Promise<OrganizerPlatformSubscription> {
  const now = new Date();
  const ends = new Date(now);
  ends.setDate(ends.getDate() + FREE_TRIAL_DAYS);

  const payload = {
    organizer_user_id: organizerUserId,
    plan_code: 'free' as const,
    status: 'trial' as const,
    trial_started_at: now.toISOString(),
    trial_ends_at: ends.toISOString(),
    current_period_start: now.toISOString(),
    current_period_end: ends.toISOString(),
  };

  const existing = await getOrganizerPlatformSubscription(organizerUserId).catch(() => null);

  if (existing) {
    // Allow restart only when unpaid/expired (not mid-trial or active Pro)
    if (existing.status === 'trial' && getTrialDaysRemaining(existing) > 0) {
      return existing;
    }
    if (existing.status === 'active' && existing.plan_code === 'pro') {
      throw new Error('You already have an active Pro subscription.');
    }

    const { data, error } = await supabase
      .from(TABLES.ORGANIZER_PLATFORM_SUBSCRIPTIONS)
      .update(payload)
      .eq('organizer_user_id', organizerUserId)
      .select()
      .single();

    if (error) throw error;
    return data as OrganizerPlatformSubscription;
  }

  const { data, error } = await supabase
    .from(TABLES.ORGANIZER_PLATFORM_SUBSCRIPTIONS)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as OrganizerPlatformSubscription;
}

export async function startProCheckout(
  organizerUserId: string
): Promise<OrganizerPlatformSubscription> {
  const payload = {
    organizer_user_id: organizerUserId,
    plan_code: 'pro' as const,
    status: 'pending_payment' as const,
  };

  const existing = await getOrganizerPlatformSubscription(organizerUserId).catch(() => null);

  if (existing) {
    const { data, error } = await supabase
      .from(TABLES.ORGANIZER_PLATFORM_SUBSCRIPTIONS)
      .update(payload)
      .eq('organizer_user_id', organizerUserId)
      .select()
      .single();
    if (error) throw error;
    return data as OrganizerPlatformSubscription;
  }

  const { data, error } = await supabase
    .from(TABLES.ORGANIZER_PLATFORM_SUBSCRIPTIONS)
    .insert({
      ...payload,
      trial_started_at: null,
      trial_ends_at: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as OrganizerPlatformSubscription;
}
