import type { PricingOffer } from '../types';
import { supabase, TABLES } from '../supabase';

export const PRICING_OFFER_ID_KEY = '__pricingOfferId';
export const PRICING_OFFER_FREE_KEY = '__pricingOfferFree';

export function pricingOfferAnswerMeta(offerId: string, isFree: boolean): Record<string, string> {
  return {
    [PRICING_OFFER_ID_KEY]: offerId,
    [PRICING_OFFER_FREE_KEY]: isFree ? '1' : '0',
  };
}

export function answersWithoutPricingOfferMeta<T extends Record<string, unknown>>(answers: T): T {
  const next = { ...answers };
  delete next[PRICING_OFFER_ID_KEY];
  delete next[PRICING_OFFER_FREE_KEY];
  return next;
}

export function isPricingOfferSoldOut(offer: PricingOffer, taken: number): boolean {
  if (offer.isSoldOut) return true;
  if (offer.capacity == null || Number.isNaN(Number(offer.capacity))) return false;
  return taken >= Number(offer.capacity);
}

function readAnswers(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

/**
 * Seats taken per offer. A seat counts only after the registration is approved.
 * Paid tickets are approved on submit. Free tickets stay pending until an organizer approves them.
 */
export async function fetchPricingOfferTakenCounts(eventId: string): Promise<Record<string, number>> {
  if (!eventId || eventId === 'new' || eventId === 'public') return {};
  const { data, error } = await supabase
    .from(TABLES.FORM_SUBMISSIONS)
    .select('answers, approval_status')
    .eq('event_id', eventId);
  if (error) {
    console.error('Error counting ticket places:', error);
    return {};
  }
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    if (row.approval_status !== 'accepted') continue;
    const answers = readAnswers(row.answers);
    const offerId = answers[PRICING_OFFER_ID_KEY];
    if (typeof offerId !== 'string' || !offerId) continue;
    counts[offerId] = (counts[offerId] || 0) + 1;
  }
  return counts;
}
