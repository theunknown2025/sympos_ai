import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getOrganizerPlatformSubscription,
  getTrialDaysRemaining,
  isSubscriptionAccessAllowed,
  needsPackageSelection,
  isProPaymentUnderReview,
  shouldShowFreeTrialHeader,
  OrganizerPlatformSubscription,
  startFreeTrial,
  startProCheckout,
} from '../services/organizerPlatformSubscriptionService';

interface OrganizerPlatformSubscriptionContextValue {
  subscription: OrganizerPlatformSubscription | null;
  loading: boolean;
  error: string | null;
  trialDaysLeft: number;
  needsPackage: boolean;
  hasAccess: boolean;
  /** Pro proof submitted — waiting for Super Admin approval */
  isProUnderReview: boolean;
  /** Free plan + days remaining — for header / gates */
  showFreeTrialHeader: boolean;
  refresh: () => Promise<void>;
  activateFree: () => Promise<OrganizerPlatformSubscription>;
  upgradeToPro: () => Promise<OrganizerPlatformSubscription>;
}

const OrganizerPlatformSubscriptionContext =
  createContext<OrganizerPlatformSubscriptionContextValue | null>(null);

export const OrganizerPlatformSubscriptionProvider: React.FC<{
  userId: string | undefined;
  enabled: boolean;
  children: React.ReactNode;
}> = ({ userId, enabled, children }) => {
  const [subscription, setSubscription] = useState<OrganizerPlatformSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !userId) {
      setSubscription(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await getOrganizerPlatformSubscription(userId);
      setSubscription(row);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to load subscription');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Re-check trial expiry periodically while on trial
  useEffect(() => {
    if (!enabled || !subscription || subscription.status !== 'trial') return;
    const id = window.setInterval(() => {
      void refresh();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [enabled, subscription, refresh]);

  const activateFree = useCallback(async () => {
    if (!userId) throw new Error('Not signed in');
    const row = await startFreeTrial(userId);
    setSubscription(row);
    return row;
  }, [userId]);

  const upgradeToPro = useCallback(async () => {
    if (!userId) throw new Error('Not signed in');
    const row = await startProCheckout(userId);
    setSubscription(row);
    return row;
  }, [userId]);

  const value = useMemo<OrganizerPlatformSubscriptionContextValue>(() => {
    const trialDaysLeft = getTrialDaysRemaining(subscription);
    return {
      subscription,
      loading,
      error,
      trialDaysLeft,
      needsPackage: needsPackageSelection(subscription),
      hasAccess: isSubscriptionAccessAllowed(subscription),
      isProUnderReview: isProPaymentUnderReview(subscription),
      showFreeTrialHeader: shouldShowFreeTrialHeader(subscription),
      refresh,
      activateFree,
      upgradeToPro,
    };
  }, [subscription, loading, error, refresh, activateFree, upgradeToPro]);

  return (
    <OrganizerPlatformSubscriptionContext.Provider value={value}>
      {children}
    </OrganizerPlatformSubscriptionContext.Provider>
  );
};

export function useOrganizerPlatformSubscription(): OrganizerPlatformSubscriptionContextValue {
  const ctx = useContext(OrganizerPlatformSubscriptionContext);
  if (!ctx) {
    return {
      subscription: null,
      loading: false,
      error: null,
      trialDaysLeft: 0,
      needsPackage: false,
      hasAccess: true,
      isProUnderReview: false,
      showFreeTrialHeader: false,
      refresh: async () => undefined,
      activateFree: async () => {
        throw new Error('Subscription provider not mounted');
      },
      upgradeToPro: async () => {
        throw new Error('Subscription provider not mounted');
      },
    };
  }
  return ctx;
}
