import { supabase } from '../supabase';

const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001';

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchSuperAdminProOrders(status?: string): Promise<unknown[]> {
  const headers = await authHeaders();
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${EMAIL_API_URL}/api/superadmin/pro-orders${qs}`, { headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || body.error || 'Failed to load pro orders');
  return body.orders || [];
}

export async function approveSuperAdminProOrder(
  orderId: string,
  adminNotes?: string
): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${EMAIL_API_URL}/api/superadmin/pro-orders/${orderId}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ adminNotes: adminNotes || null }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || body.error || 'Approve failed');
}

export async function rejectSuperAdminProOrder(
  orderId: string,
  adminNotes?: string
): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${EMAIL_API_URL}/api/superadmin/pro-orders/${orderId}/reject`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ adminNotes: adminNotes || null }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || body.error || 'Reject failed');
}
