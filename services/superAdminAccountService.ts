import { callSuperAdminApi } from './superAdminRemote';

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
  const qs = role ? `?role=${encodeURIComponent(role)}` : '';
  const body = await callSuperAdminApi<{ accounts?: SuperAdminAccountRow[] }>(
    { path: `/api/superadmin/accounts${qs}` },
    { action: 'list-accounts', role: role || '' },
    'Failed to load accounts'
  );
  const rows = body.accounts || [];
  if (!role) return rows;
  return rows.filter((a) => matchesAccountTabRole(a.role, role));
}

export async function suspendSuperAdminAccount(userId: string): Promise<void> {
  await callSuperAdminApi(
    { path: `/api/superadmin/accounts/${userId}/suspend`, method: 'POST' },
    { action: 'suspend', userId },
    'Suspend failed'
  );
}

export async function activateSuperAdminAccount(userId: string): Promise<void> {
  await callSuperAdminApi(
    { path: `/api/superadmin/accounts/${userId}/activate`, method: 'POST' },
    { action: 'activate', userId },
    'Activate failed'
  );
}

export async function grantOrganizerProAccount(
  userId: string,
  eventsCount = 1
): Promise<void> {
  await callSuperAdminApi(
    {
      path: `/api/superadmin/accounts/${userId}/grant-pro`,
      method: 'POST',
      body: { eventsCount },
    },
    { action: 'grant-pro', userId, eventsCount },
    'Grant Pro failed'
  );
}

export async function deleteSuperAdminAccount(userId: string): Promise<void> {
  await callSuperAdminApi(
    { path: `/api/superadmin/accounts/${userId}`, method: 'DELETE' },
    { action: 'delete', userId },
    'Delete failed'
  );
}
