import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminDisplaySettings } from '../../../contexts/AdminDisplaySettingsContext';
import { useOrganizerPlatformSubscription } from '../../../contexts/OrganizerPlatformSubscriptionContext';
import { getRoutePath } from '../../../routes';
import { ViewState } from '../../../types';
import { ProPaymentUnderReviewNotice } from './ProPaymentUnderReviewNotice';

/** Banner when organizer has no paid/active plan (or expired trial / Pro under review). */
export const SubscriptionUnpaidBanner: React.FC = () => {
  const { language } = useAdminDisplaySettings();
  const fr = language === 'fr';
  const navigate = useNavigate();
  const { needsPackage, loading, subscription, isProUnderReview } =
    useOrganizerPlatformSubscription();

  if (loading || !needsPackage) return null;

  if (isProUnderReview) {
    return <ProPaymentUnderReviewNotice className="mb-6" />;
  }

  const expired = subscription?.status === 'expired';

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-amber-950">
          <p className="font-semibold">
            {expired
              ? (fr ? 'Votre essai gratuit a expiré' : 'Your free trial has expired')
              : (fr ? 'Abonnement non payé' : 'Subscription not paid')}
          </p>
          <p className="mt-0.5 text-amber-800">
            {fr
              ? 'Sélectionnez une offre et payez (ou démarrez l’essai Free de 15 jours) pour continuer.'
              : 'Select a package and pay (or start the 15-day Free trial) to continue.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate(getRoutePath(ViewState.ACCOUNT_SUBSCRIPTIONS))}
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 shrink-0"
      >
        {fr ? 'Voir les offres' : 'View offers'}
        <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default SubscriptionUnpaidBanner;
