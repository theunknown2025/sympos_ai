/**
 * Organizer Pro order submit (service role — bypasses RLS).
 * Caller must send Authorization: Bearer <access_token> of the organizer.
 */
import { createClient } from '@supabase/supabase-js';

const PRO_TVA_RATE = 0.2;
const ALLOWED_OFFERS = new Set(['single_event', 'single_event_editions', 'multi_events']);

function getAdminClient(readEnv) {
  const url = readEnv('VITE_SUPABASE_URL');
  const serviceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireAuthUser(req, admin) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    const err = new Error('Missing authorization token');
    err.status = 401;
    throw err;
  }
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    const err = new Error('Invalid or expired session');
    err.status = 401;
    throw err;
  }
  return data.user;
}

function getProUnitPrices(offerCode, eventsCount) {
  if (offerCode === 'single_event') {
    return { pricePerEventMad: 5000, pricePerEditionMad: 0, contactSales: false };
  }
  if (offerCode === 'single_event_editions') {
    return { pricePerEventMad: 5000, pricePerEditionMad: 3500, contactSales: false };
  }
  if (eventsCount > 10) {
    return { pricePerEventMad: 0, pricePerEditionMad: 0, contactSales: true };
  }
  if (eventsCount >= 6) {
    return { pricePerEventMad: 3000, pricePerEditionMad: 750, contactSales: false };
  }
  return { pricePerEventMad: 4500, pricePerEditionMad: 750, contactSales: false };
}

function normalizeCounts(offerCode, eventsCount, editionsCount) {
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

function computeQuote(offerCode, eventsCount, editionsCount) {
  const counts = normalizeCounts(offerCode, eventsCount, editionsCount);
  const units = getProUnitPrices(offerCode, counts.eventsCount);
  const amountHtMad =
    counts.eventsCount * units.pricePerEventMad +
    counts.editionsCount * units.pricePerEditionMad;
  const amountTvaMad = Math.round(amountHtMad * PRO_TVA_RATE * 100) / 100;
  const amountTtcMad = Math.round((amountHtMad + amountTvaMad) * 100) / 100;
  return {
    ...counts,
    ...units,
    amountHtMad,
    tvaRate: PRO_TVA_RATE,
    amountTtcMad,
  };
}

export function registerOrganizerProOrderRoutes(app, { readEnv }) {
  app.post('/api/organizer/pro-orders', async (req, res) => {
    try {
      const admin = getAdminClient(readEnv);
      const user = await requireAuthUser(req, admin);

      const {
        offerCode,
        fullName,
        accountEmail,
        eventsCount,
        editionsCount,
        proofUrls,
        proofNames,
        organizerNotes,
      } = req.body || {};

      if (!ALLOWED_OFFERS.has(offerCode)) {
        return res.status(400).json({ error: 'Invalid offer code' });
      }
      if (!String(fullName || '').trim() || !String(accountEmail || '').trim()) {
        return res.status(400).json({ error: 'Full name and account email are required.' });
      }
      if (!Array.isArray(proofUrls) || proofUrls.length === 0) {
        return res.status(400).json({ error: 'Please upload at least one proof of payment.' });
      }

      const quote = computeQuote(offerCode, eventsCount, editionsCount);
      if (quote.contactSales) {
        return res.status(400).json({ error: 'Contact Sales for more than 10 events.' });
      }

      const payload = {
        organizer_user_id: user.id,
        offer_code: offerCode,
        full_name: String(fullName).trim(),
        account_email: String(accountEmail).trim().toLowerCase(),
        events_count: quote.eventsCount,
        editions_count: quote.editionsCount,
        price_per_event_mad: quote.pricePerEventMad,
        price_per_edition_mad: quote.pricePerEditionMad,
        amount_ht_mad: quote.amountHtMad,
        tva_rate: quote.tvaRate,
        amount_ttc_mad: quote.amountTtcMad,
        currency: 'MAD',
        status: 'pending_review',
        proof_file_urls: proofUrls.map(String),
        proof_file_names: (Array.isArray(proofNames) ? proofNames : []).map(String),
        organizer_notes: String(organizerNotes || '').trim() || null,
      };

      const { data, error } = await admin
        .from('organizer_pro_orders')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('organizer pro order insert:', error);
        return res.status(500).json({ error: error.message || 'Failed to submit Pro order.' });
      }

      // First Pro purchase locks the account until Super Admin approves the proof.
      // An already active Pro stays active so a higher pack can be reviewed
      // without removing the events already paid for.
      const { data: existingSub } = await admin
        .from('organizer_platform_subscriptions')
        .select('plan_code, status')
        .eq('organizer_user_id', user.id)
        .maybeSingle();
      const alreadyActivePro =
        existingSub?.plan_code === 'pro' && existingSub?.status === 'active';

      if (!alreadyActivePro) {
        const { error: subError } = await admin.from('organizer_platform_subscriptions').upsert({
          organizer_user_id: user.id,
          plan_code: 'pro',
          status: 'suspended',
        });
        if (subError) {
          console.warn('Pro order saved but subscription update failed:', subError.message);
        }
      }

      return res.json({ order: data });
    } catch (error) {
      const status = error.status || 500;
      console.error('organizer pro order submit:', error);
      return res.status(status).json({
        error: error.message || 'Failed to submit Pro order.',
      });
    }
  });
}
