import { supabase } from '../supabase';

const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001';

export type SuperAdminAccountStatus =
  | 'active'
  | 'suspended'
  | 'trial'
  | 'expired'
  | 'unpaid'
  | 'pending_payment';

export interface SuperAdminAccountRow {
  id: string;
  email: string;
  role: string;
  planCode: string;
  subscriptionStatus: string | null;
  accountStatus: SuperAdminAccountStatus | string;
  daysLeft: number | null;
  trialEndsAt: string | null;
  banned: boolean;
  lastSignInAt: string | null;
  createdAt: string | null;
  fullName: string | null;
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function matchesAccountTabRole(
  accountRole: string,
  tabRole: 'Organizer' | 'Participant' | 'SuperAdmin'
): boolean {
  if (tabRole === 'SuperAdmin') {
    return accountRole === 'SuperAdmin' || accountRole === 'SubSuperAdmin';
  }
  return accountRole === tabRole;
}

export async function fetchSuperAdminAccounts(
  role?: 'Organizer' | 'Participant' | 'SuperAdmin'
): Promise<SuperAdminAccountRow[]> {
  const headers = await authHeaders();
  const qs = role ? `?role=${encodeURIComponent(role)}` : '';
  const res = await fetch(`${EMAIL_API_URL}/api/superadmin/accounts${qs}`, { headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || 'Failed to load accounts');
  }
  const rows = (body.accounts || []) as SuperAdminAccountRow[];
  // Always filter client-side so tabs stay correct even if API is stale
  if (!role) return rows;
  return rows.filter((a) => matchesAccountTabRole(a.role, role));
}

export async function suspendSuperAdminAccount(userId: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${EMAIL_API_URL}/api/superadmin/accounts/${userId}/suspend`, {
    method: 'POST',
    headers,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || body.error || 'Suspend failed');
}

export async function activateSuperAdminAccount(userId: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${EMAIL_API_URL}/api/superadmin/accounts/${userId}/activate`, {
    method: 'POST',
    headers,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || body.error || 'Activate failed');
}

export async function deleteSuperAdminAccount(userId: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${EMAIL_API_URL}/api/superadmin/accounts/${userId}`, {
    method: 'DELETE',
    headers,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || body.error || 'Delete failed');
}
