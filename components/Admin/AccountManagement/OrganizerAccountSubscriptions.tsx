import React, { useState } from 'react';
import { Check, Crown, Gift, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminDisplaySettings } from '../../../contexts/AdminDisplaySettingsContext';
import { useOrganizerPlatformSubscription } from '../../../contexts/OrganizerPlatformSubscriptionContext';
import {
  FREE_TRIAL_DAYS,
  PLATFORM_OFFERS,
} from '../../../services/organizerPlatformSubscriptionService';
import { getRoutePath } from '../../../routes';
import { ViewState } from '../../../types';
import { ProPaymentUnderReviewNotice } from './ProPaymentUnderReviewNotice';

const OrganizerAccountSubscriptions: React.FC = () => {
  const { language } = useAdminDisplaySettings();
  const fr = language === 'fr';
  const navigate = useNavigate();
  const {
    subscription,
    loading,
    trialDaysLeft,
    activateFree,
    needsPackage,
    isProUnderReview,
  } = useOrganizerPlatformSubscription();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const freeOffer = PLATFORM_OFFERS.find((o) => o.id === 'free')!;
  const status = subscription?.status;
  const isTrialActive = status === 'trial' && trialDaysLeft > 0;
  const isProActive = status === 'active' && subscription?.plan_code === 'pro';

  const handleStartFree = async () => {
    if (isProUnderReview) return;
    setError(null);
    setBusy(true);
    try {
      await activateFree();
      navigate(getRoutePath(ViewState.ORGANIZER_WORKSPACE), { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : (fr ? 'Action impossible.' : 'Action failed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold text-slate-900">
          {fr ? 'Abonnements' : 'Subscriptions'}
        </h1>
        <p className="mt-1 text-slate-500">
          {fr
            ? 'Démarrez Free (15 jours) ou passez à Pro avec paiement en MAD.'
            : 'Start Free (15 days) or Go Pro with payment in MAD.'}
        </p>
      </div>

      {isProUnderReview && <ProPaymentUnderReviewNotice />}

      {needsPackage && !isProUnderReview && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
          {fr
            ? 'Votre abonnement n’est pas actif. Démarrez l’essai Free ou choisissez Pro.'
            : 'Your subscription is not active. Start the Free trial or choose Pro.'}
        </div>
      )}

      {!loading && isTrialActive && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-indigo-900 text-sm flex flex-wrap items-center justify-between gap-3">
          <span>
            {fr
              ? `Essai Free actif — ${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''} restant${trialDaysLeft > 1 ? 's' : ''}.`
              : `Free trial active — ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left.`}
          </span>
          <button
            type="button"
            onClick={() => navigate(getRoutePath(ViewState.ACCOUNT_PRO))}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            <Crown size={14} />
            {fr ? 'Passer à Pro' : 'Go Pro'}
          </button>
        </div>
      )}

      {isProActive && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 text-sm">
          {fr ? 'Votre compte Pro est actif.' : 'Your Pro account is active.'}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 py-12 justify-center">
          <Loader2 className="animate-spin" size={20} />
          {fr ? 'Chargement…' : 'Loading…'}
        </div>
      ) : isProUnderReview ? null : (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-xl p-2.5 bg-slate-100 text-slate-600">
                <Gift size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{freeOffer.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{freeOffer.description}</p>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-slate-900">{freeOffer.priceLabel}</span>
              <span className="text-slate-500 ml-1">
                / {FREE_TRIAL_DAYS} {fr ? 'jours' : 'days'}
              </span>
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {freeOffer.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={busy || isTrialActive || isProActive}
              onClick={() => void handleStartFree()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {isTrialActive
                ? (fr ? 'Essai en cours' : 'Trial in progress')
                : (fr ? 'Démarrer l’essai Free' : 'Start free trial')}
            </button>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-white p-6 flex flex-col shadow-sm ring-1 ring-indigo-100">
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-xl p-2.5 bg-indigo-100 text-indigo-700">
                <Crown size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Pro</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {fr
                    ? '1 événement, éditions ou volume — paiement MAD TTC + preuve.'
                    : '1 event, editions, or volume — MAD TTC payment + proof.'}
                </p>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-slate-900">MAD</span>
              <span className="text-slate-500 ml-1">{fr ? '/ offre' : '/ offer'}</span>
            </div>
            <ul className="space-y-2 mb-6 flex-1 text-sm text-slate-600">
              <li className="flex gap-2"><Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />1 Event — 5000 MAD</li>
              <li className="flex gap-2"><Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />{fr ? 'Éditions' : 'Editions'} — +3500 MAD</li>
              <li className="flex gap-2"><Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />2–10 {fr ? 'événements' : 'events'} — volume</li>
            </ul>
            <button
              type="button"
              onClick={() => navigate(getRoutePath(ViewState.ACCOUNT_PRO))}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Crown size={16} />
              {isProActive
                ? (fr ? 'Offre supérieure' : 'Higher pack')
                : (fr ? 'Passer à Pro' : 'Go Pro')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerAccountSubscriptions;
