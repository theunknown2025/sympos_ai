import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Crown,
  FileUp,
  Loader2,
  Layers,
  Mail,
  Phone,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useAdminDisplaySettings } from '../../../contexts/AdminDisplaySettingsContext';
import { useOrganizerPlatformSubscription } from '../../../contexts/OrganizerPlatformSubscriptionContext';
import {
  computeProQuote,
  formatMad,
  PRO_OFFERS,
  ProOfferCode,
} from '../../../services/proOfferPricing';
import {
  listMyProOrders,
  OrganizerProOrder,
  submitProOrder,
  uploadProPaymentProof,
} from '../../../services/organizerProOrderService';
import { getRoutePath } from '../../../routes';
import { ViewState } from '../../../types';
import { ProPaymentUnderReviewNotice } from './ProPaymentUnderReviewNotice';

type Step = 'offers' | 'checkout' | 'done';

const SALES_EMAIL = 'admin@symposai.pro';

const OrganizerProCheckout: React.FC = () => {
  const { language } = useAdminDisplaySettings();
  const fr = language === 'fr';
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { refresh, isProUnderReview } = useOrganizerPlatformSubscription();

  const [step, setStep] = useState<Step>('offers');
  const [offerCode, setOfferCode] = useState<ProOfferCode | null>(null);
  const [fullName, setFullName] = useState('');
  const [accountEmail, setAccountEmail] = useState(currentUser?.email || '');
  const [eventsCount, setEventsCount] = useState(1);
  const [editionsCount, setEditionsCount] = useState(0);
  const [proofFiles, setProofFiles] = useState<{ url: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myOrders, setMyOrders] = useState<OrganizerProOrder[]>([]);

  useEffect(() => {
    if (currentUser?.email) setAccountEmail(currentUser.email);
  }, [currentUser?.email]);

  useEffect(() => {
    if (!currentUser?.id) return;
    void listMyProOrders(currentUser.id)
      .then(setMyOrders)
      .catch(() => setMyOrders([]));
  }, [currentUser?.id, step]);

  const quote = useMemo(() => {
    if (!offerCode) return null;
    return computeProQuote(offerCode, eventsCount, editionsCount);
  }, [offerCode, eventsCount, editionsCount]);

  const selectedOffer = PRO_OFFERS.find((o) => o.code === offerCode);

  const startCheckout = (code: ProOfferCode) => {
    setError(null);
    setOfferCode(code);
    if (code === 'single_event') {
      setEventsCount(1);
      setEditionsCount(0);
    } else if (code === 'single_event_editions') {
      setEventsCount(1);
      setEditionsCount(Math.max(0, editionsCount));
    } else {
      setEventsCount(Math.max(2, eventsCount));
    }
    setStep('checkout');
  };

  const onProofSelected = async (files: FileList | null) => {
    if (!files?.length || !currentUser?.id) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: { url: string; name: string }[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadProPaymentProof(currentUser.id, file));
      }
      setProofFiles((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : (fr ? 'Échec du téléversement.' : 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !offerCode || !quote) return;
    if (quote.contactSales) {
      setError(fr ? 'Contactez les ventes pour plus de 10 événements.' : 'Contact Sales for more than 10 events.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitProOrder({
        organizerUserId: currentUser.id,
        offerCode,
        fullName,
        accountEmail,
        eventsCount: quote.eventsCount,
        editionsCount: quote.editionsCount,
        proofUrls: proofFiles.map((p) => p.url),
        proofNames: proofFiles.map((p) => p.name),
      });
      await refresh();
      setStep('done');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err
            ? String((err as { message: unknown }).message)
            : fr
              ? 'Envoi impossible.'
              : 'Submit failed.';
      setError(msg || (fr ? 'Envoi impossible.' : 'Submit failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => {
              if (step === 'checkout') {
                setStep('offers');
                return;
              }
              navigate(getRoutePath(ViewState.ACCOUNT_SUBSCRIPTIONS));
            }}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft size={16} />
            {fr ? 'Retour' : 'Back'}
          </button>
          <h1 className="text-3xl font-bold text-slate-900 inline-flex items-center gap-2">
            <Crown className="text-indigo-600" size={28} />
            {fr ? 'Passer à Pro' : 'Go Pro'}
          </h1>
          <p className="mt-1 text-slate-500 text-sm">
            {fr
              ? 'Choisissez une offre, renseignez le formulaire et joignez la preuve de paiement (MAD TTC).'
              : 'Choose an offer, fill the form, and upload your proof of payment (MAD TTC).'}
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {(isProUnderReview || step === 'done') && (
        <div className="space-y-4">
          <ProPaymentUnderReviewNotice />
          <button
            type="button"
            onClick={() => navigate(getRoutePath(ViewState.ACCOUNT_SUBSCRIPTIONS))}
            className="inline-flex rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
          >
            {fr ? 'Voir Abonnements' : 'View Subscriptions'}
          </button>
        </div>
      )}

      {!isProUnderReview && step !== 'done' && step === 'offers' && (
        <div className="grid gap-4 md:grid-cols-3">
          {PRO_OFFERS.map((offer) => {
            const Icon =
              offer.code === 'single_event'
                ? Calendar
                : offer.code === 'single_event_editions'
                  ? Layers
                  : Building2;
            return (
              <div
                key={offer.code}
                className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col shadow-sm"
              >
                <div className="rounded-xl bg-indigo-50 text-indigo-700 w-fit p-2.5 mb-3">
                  <Icon size={22} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {fr ? offer.nameFr : offer.nameEn}
                </h2>
                <p className="text-sm font-medium text-indigo-700 mt-1">
                  {fr ? offer.descriptionFr : offer.descriptionEn}
                </p>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed flex-1">
                  {fr ? offer.explanationFr : offer.explanationEn}
                </p>
                {offer.code === 'multi_events' && (
                  <ul className="mt-3 space-y-1 text-xs text-slate-600 mb-2">
                    <li>2–5: 4500 MAD / {fr ? 'évèn.' : 'event'} + 750 / {fr ? 'éd.' : 'ed.'}</li>
                    <li>6–10: 3000 MAD / {fr ? 'évèn.' : 'event'} + 750 / {fr ? 'éd.' : 'ed.'}</li>
                    <li>{fr ? 'Plus : Contacter les ventes' : 'More: Contact Sales'}</li>
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => startCheckout(offer.code)}
                  className="mt-4 w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {fr ? 'Sélectionner' : 'Select'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!isProUnderReview && step !== 'done' && step === 'checkout' && offerCode && quote && selectedOffer && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm text-indigo-900">
            <strong>{fr ? selectedOffer.nameFr : selectedOffer.nameEn}</strong>
            <span className="text-indigo-700"> — {fr ? quote.tierLabelFr : quote.tierLabelEn}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {fr ? 'Nom complet' : 'Full name'}
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {fr ? 'Email du compte' : 'Account email'}
              </label>
              <input
                required
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {fr ? 'Nombre d’événements' : 'Number of events'}
              </label>
              <input
                required
                type="number"
                min={offerCode === 'multi_events' ? 2 : 1}
                max={offerCode === 'multi_events' ? 50 : 1}
                disabled={offerCode !== 'multi_events'}
                value={eventsCount}
                onChange={(e) => setEventsCount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {fr ? 'Nombre d’éditions' : 'Number of editions'}
              </label>
              <input
                required
                type="number"
                min={0}
                disabled={offerCode === 'single_event'}
                value={editionsCount}
                onChange={(e) => setEditionsCount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
              {offerCode !== 'single_event' && (
                <p className="text-xs text-slate-400 mt-1">
                  {fr ? 'À la demande (0 si aucune).' : 'On demand (0 if none).'}
                </p>
              )}
            </div>
          </div>

          {quote.contactSales ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950 space-y-2">
              <p className="font-semibold">
                {fr ? 'Plus de 10 événements — Contacter les ventes' : 'More than 10 events — Contact Sales'}
              </p>
              <a
                href={`mailto:${SALES_EMAIL}?subject=SymposAI%20Pro%20-%20More%20than%2010%20events`}
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:underline"
              >
                <Mail size={16} />
                {SALES_EMAIL}
              </a>
              <p className="text-xs text-amber-800 inline-flex items-center gap-1">
                <Phone size={12} />
                {fr ? 'Un devis personnalisé vous sera envoyé.' : 'A custom quote will be sent to you.'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>
                  {quote.eventsCount} × {formatMad(quote.pricePerEventMad)} ({fr ? 'évèn.' : 'events'})
                </span>
                <span>{formatMad(quote.eventsCount * quote.pricePerEventMad)}</span>
              </div>
              {quote.editionsCount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>
                    {quote.editionsCount} × {formatMad(quote.pricePerEditionMad)} ({fr ? 'éd.' : 'editions'})
                  </span>
                  <span>{formatMad(quote.editionsCount * quote.pricePerEditionMad)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-2">
                <span>{fr ? 'Sous-total HT' : 'Subtotal excl. tax'}</span>
                <span>{formatMad(quote.amountHtMad)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>TVA ({Math.round(quote.tvaRate * 100)}%)</span>
                <span>{formatMad(quote.amountTvaMad)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-1">
                <span>{fr ? 'Total TTC' : 'Total incl. tax (TTC)'}</span>
                <span>{formatMad(quote.amountTtcMad)}</span>
              </div>
            </div>
          )}

          {!quote.contactSales && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {fr ? 'Preuve de paiement' : 'Proof of payment'}
                </label>
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40">
                  <FileUp className="text-slate-400" size={28} />
                  <span className="text-sm text-slate-600">
                    {uploading
                      ? (fr ? 'Téléversement…' : 'Uploading…')
                      : (fr ? 'PDF, JPG ou PNG — cliquez pour ajouter' : 'PDF, JPG or PNG — click to add')}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => void onProofSelected(e.target.files)}
                  />
                </label>
                {proofFiles.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {proofFiles.map((p) => (
                      <li
                        key={p.url}
                        className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2"
                      >
                        <a href={p.url} target="_blank" rel="noreferrer" className="truncate hover:underline">
                          {p.name}
                        </a>
                        <button
                          type="button"
                          onClick={() => setProofFiles((prev) => prev.filter((x) => x.url !== p.url))}
                          className="p-1 text-slate-400 hover:text-red-600"
                          aria-label="Remove"
                        >
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || uploading || proofFiles.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {(submitting || uploading) && <Loader2 size={16} className="animate-spin" />}
                {fr ? 'Envoyer pour validation' : 'Submit for validation'}
              </button>
            </>
          )}
        </form>
      )}

      {!isProUnderReview && myOrders.length > 0 && step === 'offers' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">
            {fr ? 'Vos demandes Pro' : 'Your Pro requests'}
          </h3>
          <ul className="space-y-2 text-sm">
            {myOrders.slice(0, 5).map((o) => (
              <li key={o.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-slate-700">
                  {o.offer_code} — {formatMad(Number(o.amount_ttc_mad))} TTC
                </span>
                <span className="capitalize font-medium text-slate-900">{o.status.replace('_', ' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OrganizerProCheckout;
