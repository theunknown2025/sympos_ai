import React, { useEffect, useState } from 'react';
import { Gift, Crown, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminDisplaySettings } from '../../../contexts/AdminDisplaySettingsContext';
import { useOrganizerPlatformSubscription } from '../../../contexts/OrganizerPlatformSubscriptionContext';
import {
  getTrialDaysRemaining,
  isFreePlan,
  shouldShowFreeTrialHeader,
} from '../../../services/organizerPlatformSubscriptionService';
import { getRoutePath } from '../../../routes';
import { ViewState } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';

/**
 * Fixed header badge for Free (15-day) organizers.
 * Checks subscription type (free) first, then days remaining.
 * Rendered on every organizer page via the shared Header.
 */
export const FreeTrialHeaderBanner: React.FC = () => {
  const { userRole } = useAuth();
  const { language } = useAdminDisplaySettings();
  const fr = language === 'fr';
  const navigate = useNavigate();
  const { subscription, loading } = useOrganizerPlatformSubscription();

  // Live days left (recompute periodically so all pages stay accurate)
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    if (!isFreePlan(subscription)) {
      setDaysLeft(0);
      return;
    }
    const tick = () => setDaysLeft(getTrialDaysRemaining(subscription));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [subscription]);

  if (userRole !== 'Organizer' || loading) return null;
  if (!shouldShowFreeTrialHeader(subscription)) return null;
  if (daysLeft <= 0) return null;

  const label = fr
    ? `Essai Free — ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`
    : `Free trial — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 max-w-full"
      role="status"
      aria-live="polite"
      data-plan="free"
      data-days-left={daysLeft}
    >
      <Gift size={16} className="text-indigo-600 shrink-0" aria-hidden />
      <span className="text-xs sm:text-sm font-medium text-indigo-900 truncate">{label}</span>
      <button
        type="button"
        onClick={() => navigate(getRoutePath(ViewState.ACCOUNT_PRO))}
        className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 shrink-0"
      >
        <Crown size={12} aria-hidden />
        {fr ? 'Passer à Pro' : 'Go Pro'}
        <ArrowUpRight size={12} aria-hidden />
      </button>
    </div>
  );
};

export default FreeTrialHeaderBanner;
