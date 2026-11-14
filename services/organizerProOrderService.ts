import { supabase, TABLES } from '../supabase';
import { uploadFileToStorage } from './storageService';
import {
  computeProQuote,
  ProOfferCode,
  PRO_TVA_RATE,
} from './proOfferPricing';

export type ProOrderStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface OrganizerProOrder {
  id: string;
  organizer_user_id: string;
  offer_code: ProOfferCode;
  full_name: string;
  account_email: string;
  events_count: number;
  editions_count: number;
  price_per_event_mad: number;
  price_per_edition_mad: number;
  amount_ht_mad: number;
  tva_rate: number;
  amount_ttc_mad: number;
  currency: string;
  status: ProOrderStatus;
  proof_file_urls: string[];
  proof_file_names: string[];
  organizer_notes: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapOrder(row: Record<string, unknown>): OrganizerProOrder {
  return {
    id: String(row.id),
    organizer_user_id: String(row.organizer_user_id),
    offer_code: row.offer_code as ProOfferCode,
    full_name: String(row.full_name || ''),
    account_email: String(row.account_email || ''),
    events_count: Number(row.events_count || 1),
    editions_count: Number(row.editions_count || 0),
    price_per_event_mad: Number(row.price_per_event_mad || 0),
    price_per_edition_mad: Number(row.price_per_edition_mad || 0),
    amount_ht_mad: Number(row.amount_ht_mad || 0),
    tva_rate: Number(row.tva_rate ?? PRO_TVA_RATE),
    amount_ttc_mad: Number(row.amount_ttc_mad || 0),
    currency: String(row.currency || 'MAD'),
    status: row.status as ProOrderStatus,
    proof_file_urls: parseJsonArray(row.proof_file_urls),
    proof_file_names: parseJsonArray(row.proof_file_names),
    organizer_notes: (row.organizer_notes as string) || null,
    admin_notes: (row.admin_notes as string) || null,
    reviewed_by: (row.reviewed_by as string) || null,
    reviewed_at: (row.reviewed_at as string) || null,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export async function uploadProPaymentProof(
  userId: string,
  file: File
): Promise<{ url: string; name: string }> {
  const url = await uploadFileToStorage(userId, file, 'pro-payment-proofs');
  return { url, name: file.name };
}

export interface SubmitProOrderInput {
  organizerUserId: string;
  offerCode: ProOfferCode;
  fullName: string;
  accountEmail: string;
  eventsCount: number;
  editionsCount: number;
  proofUrls: string[];
  proofNames: string[];
  organizerNotes?: string;
}

export async function submitProOrder(input: SubmitProOrderInput): Promise<OrganizerProOrder> {
  const quote = computeProQuote(input.offerCode, input.eventsCount, input.editionsCount);
  if (quote.contactSales) {
    throw new Error('Contact Sales for more than 10 events.');
  }
  if (!input.fullName.trim() || !input.accountEmail.trim()) {
    throw new Error('Full name and account email are required.');
  }
  if (!input.proofUrls.length) {
    throw new Error('Please upload at least one proof of payment.');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('You must be signed in to submit a Pro order.');
  }

  const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001';
  const res = await fetch(`${EMAIL_API_URL}/api/organizer/pro-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      offerCode: input.offerCode,
      fullName: input.fullName,
      accountEmail: input.accountEmail,
      eventsCount: input.eventsCount,
      editionsCount: input.editionsCount,
      proofUrls: input.proofUrls,
      proofNames: input.proofNames,
      organizerNotes: input.organizerNotes,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || body.message || 'Failed to submit Pro order.');
  }

  return mapOrder((body.order || body) as Record<string, unknown>);
}

export async function listMyProOrders(organizerUserId: string): Promise<OrganizerProOrder[]> {
  const { data, error } = await supabase
    .from(TABLES.ORGANIZER_PRO_ORDERS)
    .select('*')
    .eq('organizer_user_id', organizerUserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => mapOrder(r as Record<string, unknown>));
}

export async function listAllProOrdersForAdmin(): Promise<OrganizerProOrder[]> {
  const { data, error } = await supabase
    .from(TABLES.ORGANIZER_PRO_ORDERS)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => mapOrder(r as Record<string, unknown>));
}
