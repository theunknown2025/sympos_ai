/** Pro offer pricing (MAD). Listed unit prices are HT; TTC adds 20% TVA. */

export const PRO_TVA_RATE = 0.2;

export type ProOfferCode = 'single_event' | 'single_event_editions' | 'multi_events';

export interface ProOfferDefinition {
  code: ProOfferCode;
  nameEn: string;
  nameFr: string;
  /** Short price line shown on the card */
  descriptionEn: string;
  descriptionFr: string;
  /** Short plain-language explanation of who the offer is for */
  explanationEn: string;
  explanationFr: string;
  /** Fixed events count when set (single-event offers). */
  fixedEvents?: number;
  /** Editions allowed / shown */
  editionsEnabled: boolean;
  contactSalesOnly?: boolean;
}

export const PRO_OFFERS: ProOfferDefinition[] = [
  {
    code: 'single_event',
    nameEn: '1 Event',
    nameFr: '1 Événement',
    descriptionEn: '5000 MAD / Event',
    descriptionFr: '5000 MAD / Événement',
    explanationEn:
      'Best if you run a single conference or congress once. One event license, no extra editions.',
    explanationFr:
      'Idéal si vous organisez une seule conférence ou un congrès une fois. Licence pour 1 événement, sans éditions supplémentaires.',
    fixedEvents: 1,
    editionsEnabled: false,
  },
  {
    code: 'single_event_editions',
    nameEn: '1 Event — multiple editions',
    nameFr: '1 Événement — plusieurs éditions',
    descriptionEn: '5000 MAD / Event + 3500 MAD / Edition',
    descriptionFr: '5000 MAD / Événement + 3500 MAD / Édition',
    explanationEn:
      'Same event brand recurring over years (e.g. annual edition). Pay for the event once, then add each edition on demand.',
    explanationFr:
      'Même événement qui se répète (ex. édition annuelle). Vous payez l’événement une fois, puis chaque édition à la demande.',
    fixedEvents: 1,
    editionsEnabled: true,
  },
  {
    code: 'multi_events',
    nameEn: 'Multiple Events',
    nameFr: 'Plusieurs événements',
    descriptionEn: 'Volume pricing by number of events. Editions on demand.',
    descriptionFr: 'Tarif volume selon le nombre d’événements. Éditions à la demande.',
    explanationEn:
      'For organizers managing several different events. Lower price per event from 2 events up; editions billed separately when needed. Above 10 events, contact sales.',
    explanationFr:
      'Pour les organisateurs qui gèrent plusieurs événements distincts. Tarif dégressif à partir de 2 événements ; éditions facturées séparément si besoin. Au-delà de 10, contactez les ventes.',
    editionsEnabled: true,
  },
];

export interface ProUnitPrices {
  pricePerEventMad: number;
  pricePerEditionMad: number;
  /** When true, checkout is blocked — contact sales. */
  contactSales: boolean;
  tierLabelEn: string;
  tierLabelFr: string;
}

export function getProUnitPrices(
  offerCode: ProOfferCode,
  eventsCount: number
): ProUnitPrices {
  if (offerCode === 'single_event') {
    return {
      pricePerEventMad: 5000,
      pricePerEditionMad: 0,
      contactSales: false,
      tierLabelEn: '1 Event',
      tierLabelFr: '1 Événement',
    };
  }
  if (offerCode === 'single_event_editions') {
    return {
      pricePerEventMad: 5000,
      pricePerEditionMad: 3500,
      contactSales: false,
      tierLabelEn: '1 Event + editions',
      tierLabelFr: '1 Événement + éditions',
    };
  }

  // multi_events
  if (eventsCount >= 2 && eventsCount <= 5) {
    return {
      pricePerEventMad: 4500,
      pricePerEditionMad: 750,
      contactSales: false,
      tierLabelEn: '2–5 events',
      tierLabelFr: '2–5 événements',
    };
  }
  if (eventsCount >= 6 && eventsCount <= 10) {
    return {
      pricePerEventMad: 3000,
      pricePerEditionMad: 750,
      contactSales: false,
      tierLabelEn: '6–10 events',
      tierLabelFr: '6–10 événements',
    };
  }
  if (eventsCount > 10) {
    return {
      pricePerEventMad: 0,
      pricePerEditionMad: 0,
      contactSales: true,
      tierLabelEn: 'More than 10 — Contact Sales',
      tierLabelFr: 'Plus de 10 — Contacter les ventes',
    };
  }
  // 1 event under multi_events — nudge to single offers, but allow pricing as 2–5 floor
  return {
    pricePerEventMad: 4500,
    pricePerEditionMad: 750,
    contactSales: false,
    tierLabelEn: '2–5 events (min. 2)',
    tierLabelFr: '2–5 événements (min. 2)',
  };
}

export interface ProQuote {
  eventsCount: number;
  editionsCount: number;
  pricePerEventMad: number;
  pricePerEditionMad: number;
  amountHtMad: number;
  tvaRate: number;
  amountTvaMad: number;
  amountTtcMad: number;
  contactSales: boolean;
  tierLabelEn: string;
  tierLabelFr: string;
}

export function normalizeProCounts(
  offerCode: ProOfferCode,
  eventsCount: number,
  editionsCount: number
): { eventsCount: number; editionsCount: number } {
  let events = Math.max(1, Math.floor(Number(eventsCount) || 1));
  let editions = Math.max(0, Math.floor(Number(editionsCount) || 0));

  if (offerCode === 'single_event') {
    events = 1;
    editions = 0;
  } else if (offerCode === 'single_event_editions') {
    events = 1;
  } else if (offerCode === 'multi_events') {
    events = Math.max(2, events);
  }

  return { eventsCount: events, editionsCount: editions };
}

export function computeProQuote(
  offerCode: ProOfferCode,
  eventsCount: number,
  editionsCount: number
): ProQuote {
  const counts = normalizeProCounts(offerCode, eventsCount, editionsCount);
  const units = getProUnitPrices(offerCode, counts.eventsCount);
  const amountHtMad =
    counts.eventsCount * units.pricePerEventMad +
    counts.editionsCount * units.pricePerEditionMad;
  const amountTvaMad = Math.round(amountHtMad * PRO_TVA_RATE * 100) / 100;
  const amountTtcMad = Math.round((amountHtMad + amountTvaMad) * 100) / 100;

  return {
    eventsCount: counts.eventsCount,
    editionsCount: counts.editionsCount,
    pricePerEventMad: units.pricePerEventMad,
    pricePerEditionMad: units.pricePerEditionMad,
    amountHtMad,
    tvaRate: PRO_TVA_RATE,
    amountTvaMad,
    amountTtcMad,
    contactSales: units.contactSales,
    tierLabelEn: units.tierLabelEn,
    tierLabelFr: units.tierLabelFr,
  };
}

export function formatMad(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 2,
  }).format(amount);
}
